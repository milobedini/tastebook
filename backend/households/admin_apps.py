from django.contrib.admin.apps import AdminConfig


class StaffAdminConfig(AdminConfig):
    default_site = 'households.admin_site.StaffAdminSite'
