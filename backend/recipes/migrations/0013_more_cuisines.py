from django.apps.registry import Apps
from django.db import migrations
from django.db.backends.base.schema import BaseDatabaseSchemaEditor

CUISINES = [
    ('American', 'american'),
    ('Caribbean', 'caribbean'),
    ('German', 'german'),
    ('Korean', 'korean'),
    ('Middle Eastern', 'middle-eastern'),
    ('Moroccan', 'moroccan'),
    ('Turkish', 'turkish'),
    ('Vietnamese', 'vietnamese'),
]


def add_cuisines(apps: Apps, schema_editor: BaseDatabaseSchemaEditor) -> None:
    cuisine_model = apps.get_model('recipes', 'Cuisine')
    # Staff can add cuisines in the admin, so one of these may already be there.
    cuisine_model.objects.bulk_create(
        [cuisine_model(name=name, slug=slug) for name, slug in CUISINES], ignore_conflicts=True
    )


class Migration(migrations.Migration):
    dependencies = [
        ('recipes', '0012_recipe_source_url'),
    ]

    # Not reversed: it can't tell a cuisine it added from one staff added.
    operations = [
        migrations.RunPython(add_cuisines, migrations.RunPython.noop),
    ]
