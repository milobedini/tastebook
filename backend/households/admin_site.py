import base64
from typing import Any
from urllib.parse import urlencode

from allauth.mfa.adapter import get_adapter
from allauth.mfa.base.forms import AuthenticateForm
from allauth.mfa.totp.forms import ActivateTOTPForm
from django import forms
from django.contrib import admin
from django.http import Http404, HttpRequest, HttpResponse, HttpResponseRedirect, QueryDict
from django.shortcuts import render
from django.urls import URLPattern, URLResolver, path
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache

from households.services import has_authenticator, is_staff_account, may_open_admin, turn_on_two_factor

ADMIN_PATH = '/admin/'
SIGN_IN_PATH = '/sign-in'
TWO_FACTOR_PATH = f'{ADMIN_PATH}two-factor/'

CODE_ATTRS = {'autocomplete': 'one-time-code', 'inputmode': 'numeric'}


class SetUpTwoFactorForm(ActivateTOTPForm):
    code = forms.CharField(
        label='Code from the app',
        help_text='The 6-digit code the app shows for Tastebook.',
        widget=forms.TextInput(attrs=CODE_ATTRS),
    )


class TwoFactorCodeForm(AuthenticateForm):
    code = forms.CharField(label='Code', widget=forms.TextInput(attrs=CODE_ATTRS))


def admin_next(request: HttpRequest) -> str:
    """Where to go once through: `next` when it's an admin address, so it can't send anyone off the admin."""
    requested = request.GET.get('next', '')
    return requested if requested.startswith(ADMIN_PATH) else ADMIN_PATH


def with_next(to: str, request: HttpRequest) -> HttpResponseRedirect:
    return HttpResponseRedirect(f'{to}?{urlencode({"next": admin_next(request)})}')


def posted(request: HttpRequest) -> QueryDict | None:
    return request.POST if request.method == 'POST' else None


def qr_code_data_uri(request: HttpRequest, secret: str) -> str:
    adapter = get_adapter()
    svg = adapter.build_totp_svg(adapter.build_totp_url(request.user, secret))
    return f'data:image/svg+xml;base64,{base64.b64encode(svg.encode()).decode()}'


class StaffAdminSite(admin.AdminSite):
    def has_permission(self, request: HttpRequest) -> bool:
        return may_open_admin(request)

    # Django's password form goes: staff sign in through the app, so this is where admin_view sends anyone it refuses.
    @method_decorator(never_cache)
    def login(self, request: HttpRequest, extra_context: dict[str, Any] | None = None) -> HttpResponse:
        if not request.user.is_authenticated:
            return with_next(SIGN_IN_PATH, request)
        if not is_staff_account(request.user):
            raise Http404
        return with_next(TWO_FACTOR_PATH, request)

    def get_urls(self) -> list[URLPattern | URLResolver]:
        return [path('two-factor/', self.two_factor, name='two_factor'), *super().get_urls()]

    @method_decorator(never_cache)
    def two_factor(self, request: HttpRequest) -> HttpResponse:
        if not request.user.is_authenticated:
            return with_next(SIGN_IN_PATH, request)
        if not is_staff_account(request.user):
            raise Http404
        if may_open_admin(request):
            return HttpResponseRedirect(admin_next(request))
        if has_authenticator(request.user):
            return self.enter_code(request)
        return self.set_up(request)

    def set_up(self, request: HttpRequest) -> HttpResponse:
        # Unbound, the form makes a new key and keeps it in the session; bound, it reads that key back.
        form = SetUpTwoFactorForm(posted(request), user=request.user)
        if form.is_bound and form.is_valid():
            recovery_codes = turn_on_two_factor(request, form)
            return self.render(
                request,
                'admin/households/two_factor_recovery_codes.html',
                'Save your recovery codes',
                {'recovery_codes': recovery_codes, 'next': admin_next(request)},
            )
        return self.render(
            request,
            'admin/households/two_factor_setup.html',
            'Set up two-factor sign-in',
            {'form': form, 'key': form.secret, 'qr_code': qr_code_data_uri(request, form.secret)},
        )

    def enter_code(self, request: HttpRequest) -> HttpResponse:
        form = TwoFactorCodeForm(posted(request), user=request.user)
        if form.is_bound and form.is_valid():
            form.save()
            return HttpResponseRedirect(admin_next(request))
        return self.render(
            request, 'admin/households/two_factor_code.html', 'Enter your two-factor code', {'form': form}
        )

    def render(self, request: HttpRequest, template: str, title: str, context: dict[str, Any]) -> HttpResponse:
        request.current_app = self.name
        return render(request, template, {**self.each_context(request), 'title': title, **context})
