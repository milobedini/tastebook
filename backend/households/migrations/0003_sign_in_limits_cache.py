from django.apps.registry import Apps
from django.core.management import call_command
from django.db import migrations
from django.db.backends.base.schema import BaseDatabaseSchemaEditor


def make_cache_table(apps: Apps, schema_editor: BaseDatabaseSchemaEditor) -> None:
    # Sign-in's limits are counted in Django's database cache, so every instance shares them.
    call_command('createcachetable', database=schema_editor.connection.alias)


class Migration(migrations.Migration):
    dependencies = [
        ('households', '0002_household_user_name_user_household_and_more'),
    ]

    operations = [
        migrations.RunPython(make_cache_table, migrations.RunPython.noop),
    ]
