from django.apps.registry import Apps
from django.db import migrations, models
from django.db.backends.base.schema import BaseDatabaseSchemaEditor

COURSES = [
    ('Baking', 'baking'),
    ('Breakfast', 'breakfast'),
    ('Dessert', 'dessert'),
    ('Main', 'main'),
    ('Side', 'side'),
]

EQUIPMENT = [
    ('Air fryer', 'air-fryer'),
    ('Blender', 'blender'),
    ('Food processor', 'food-processor'),
    ('Grill', 'grill'),
    ('Hand mixer', 'hand-mixer'),
    ('Hob', 'hob'),
    ('Microwave', 'microwave'),
    ('Oven', 'oven'),
    ('Pressure cooker', 'pressure-cooker'),
    ('Slow cooker', 'slow-cooker'),
    ('Stand mixer', 'stand-mixer'),
]


def add_courses_and_equipment(apps: Apps, schema_editor: BaseDatabaseSchemaEditor) -> None:
    course_model = apps.get_model('recipes', 'Course')
    course_model.objects.bulk_create([course_model(name=name, slug=slug) for name, slug in COURSES])
    equipment_model = apps.get_model('recipes', 'Equipment')
    equipment_model.objects.bulk_create([equipment_model(name=name, slug=slug) for name, slug in EQUIPMENT])


class Migration(migrations.Migration):
    dependencies = [
        ('recipes', '0004_cuisine'),
    ]

    # Recipes saved before this migration get placeholder details (medium, no time, serves 4, no source credit)
    # so they meet the new constraints; staff correct them in the admin.
    operations = [
        migrations.CreateModel(
            name='Course',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, unique=True)),
                ('slug', models.SlugField(unique=True)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Equipment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, unique=True)),
                ('slug', models.SlugField(unique=True)),
            ],
            options={
                'ordering': ['name'],
                'verbose_name_plural': 'equipment',
            },
        ),
        migrations.AddField(
            model_name='recipe',
            name='courses',
            field=models.ManyToManyField(related_name='recipes', to='recipes.course'),
        ),
        migrations.AddField(
            model_name='recipe',
            name='difficulty',
            field=models.CharField(
                choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')], default='medium', max_length=10
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='recipe',
            name='prep_minutes',
            field=models.PositiveIntegerField(default=0),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='recipe',
            name='cook_minutes',
            field=models.PositiveIntegerField(default=0),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='recipe',
            name='extra_minutes',
            field=models.PositiveIntegerField(default=0, help_text='Waiting time, such as marinating or proving.'),
        ),
        migrations.AddField(
            model_name='recipe',
            name='extra_label',
            field=models.CharField(
                blank=True,
                help_text='What the extra time is for, such as marinating, resting or proving.',
                max_length=50,
            ),
        ),
        migrations.AddField(
            model_name='recipe',
            name='servings',
            field=models.PositiveSmallIntegerField(
                blank=True, default=4, help_text='Leave empty when giving a yield.', null=True
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='recipe',
            name='yield_amount',
            field=models.PositiveSmallIntegerField(blank=True, help_text='"12" in "makes 12 cookies".', null=True),
        ),
        migrations.AddField(
            model_name='recipe',
            name='yield_unit',
            field=models.CharField(blank=True, help_text='"cookies" in "makes 12 cookies".', max_length=50),
        ),
        migrations.AddField(
            model_name='recipe',
            name='equipment',
            field=models.ManyToManyField(blank=True, related_name='recipes', to='recipes.equipment'),
        ),
        migrations.AddField(
            model_name='recipe',
            name='one_pot',
            field=models.BooleanField(default=False, verbose_name='one-pot'),
        ),
        migrations.AddField(
            model_name='recipe',
            name='source',
            field=models.CharField(
                default='',
                help_text='Where the recipe came from: an author, a website or a book.',
                max_length=300,
                verbose_name='source credit',
            ),
            preserve_default=False,
        ),
        migrations.AddConstraint(
            model_name='recipe',
            constraint=models.CheckConstraint(
                condition=(
                    models.Q(servings__isnull=False, yield_amount__isnull=True, yield_unit='')
                    | models.Q(servings__isnull=True, yield_amount__isnull=False) & ~models.Q(yield_unit='')
                ),
                name='recipe_servings_or_yield',
                violation_error_message='Give either servings or a yield with its unit, not both.',
            ),
        ),
        migrations.AddConstraint(
            model_name='recipe',
            constraint=models.CheckConstraint(
                condition=(
                    models.Q(extra_minutes=0, extra_label='')
                    | models.Q(extra_minutes__gt=0) & ~models.Q(extra_label='')
                ),
                name='recipe_extra_time_has_label',
                violation_error_message='Give extra time with its label (marinating, resting, proving), or neither.',
            ),
        ),
        # Reversing needs no step of its own: undoing CreateModel drops the tables and their rows.
        migrations.RunPython(add_courses_and_equipment, migrations.RunPython.noop),
    ]
