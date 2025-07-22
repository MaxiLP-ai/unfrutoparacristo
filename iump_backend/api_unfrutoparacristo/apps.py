from django.apps import AppConfig

class ApiUnfrutoparacristoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api_unfrutoparacristo'

    def ready(self):
        import api_unfrutoparacristo.signals  # noqa: F401


