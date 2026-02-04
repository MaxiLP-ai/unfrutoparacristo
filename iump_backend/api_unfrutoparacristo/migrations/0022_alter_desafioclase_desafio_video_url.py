from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api_unfrutoparacristo', '0021_desafioclase_desafio_contenido'),
    ]

    operations = [
        migrations.AlterField(
            model_name='desafioclase',
            name='desafio_video_url',
            field=models.URLField(max_length=500, blank=True, null=True, help_text="Pega aquí la URL 'embed' de YouTube (opcional)", verbose_name='URL del Video'),
        ),
    ]
