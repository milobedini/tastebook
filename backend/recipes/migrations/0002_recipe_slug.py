from django.apps.registry import Apps
from django.db import migrations, models
from django.db.backends.base.schema import BaseDatabaseSchemaEditor

from recipes.slugs import base_slug, first_free_slug


def fill_slugs(apps: Apps, schema_editor: BaseDatabaseSchemaEditor) -> None:
    recipe_model = apps.get_model('recipes', 'Recipe')
    taken: set[str] = set()
    # Oldest first, so the recipe added first keeps the plain slug.
    for recipe in recipe_model.objects.order_by('id'):
        recipe.slug = first_free_slug(base_slug(recipe.title), taken)
        taken.add(recipe.slug)
        recipe.save(update_fields=['slug'])


class Migration(migrations.Migration):
    dependencies = [
        ('recipes', '0001_initial'),
    ]

    operations = [
        # No index yet: the AlterField below creates it with the unique constraint, and Postgres
        # would otherwise try to make the same varchar_pattern_ops index twice.
        migrations.AddField(
            model_name='recipe',
            name='slug',
            field=models.SlugField(db_index=False, default='', editable=False, max_length=255),
            preserve_default=False,
        ),
        migrations.RunPython(fill_slugs, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='recipe',
            name='slug',
            field=models.SlugField(editable=False, max_length=255, unique=True),
        ),
    ]
