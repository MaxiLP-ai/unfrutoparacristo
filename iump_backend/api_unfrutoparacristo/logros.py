# api_unfrutoparacristo/logros.py

# Lista de logros automáticos preestablecidos en el sistema
# tipo_metrica define qué se va a contar para evaluar el progreso.

LOGROS_ESTABLECIDOS = [
    {
        "id": "logro_primer_fruto",
        "titulo": "Mi Primer Fruto",
        "descripcion": "Pon 1 fruto en el árbol.",
        "meta": 1,
        "tipo_metrica": "frutos_colocados",
        "recompensa": 10
    },
    {
        "id": "logro_cosecha_inicial",
        "titulo": "Cosecha Inicial",
        "descripcion": "Pon 5 frutos en el árbol.",
        "meta": 5,
        "tipo_metrica": "frutos_colocados",
        "recompensa": 50
    },
    {
        "id": "logro_cosecha_abundante",
        "titulo": "Cosecha Abundante",
        "descripcion": "Pon 10 frutos en el árbol.",
        "meta": 10,
        "tipo_metrica": "frutos_colocados",
        "recompensa": 100
    },
    {
        "id": "logro_comprador_novato",
        "titulo": "Comprador Novato",
        "descripcion": "Consigue 1 artículo en tu inventario.",
        "meta": 1,
        "tipo_metrica": "items_inventario",
        "recompensa": 20
    },
    {
        "id": "logro_estudiante_constante",
        "titulo": "Estudiante Constante",
        "descripcion": "Asiste a 3 clases.",
        "meta": 3,
        "tipo_metrica": "asistencia",
        "recompensa": 30
    }
]
