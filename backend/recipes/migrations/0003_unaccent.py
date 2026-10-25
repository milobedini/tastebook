from django.contrib.postgres.operations import UnaccentExtension
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('recipes', '0002_recipe_slug'),
    ]

    operations = [
        UnaccentExtension(),
    ]
