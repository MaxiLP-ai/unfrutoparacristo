# En tu nuevo archivo api_unfrutoparacristo/utils.py

def limpiar_rut(rut):
    """Limpia un RUT de puntos y guiones, y lo devuelve en mayúsculas."""
    return "".join(c for c in str(rut) if c.isalnum()).upper()

def formatear_rut(rut):
    """Toma un RUT (limpio o no) y lo devuelve en el formato XX.XXX.XXX-X."""
    rut_limpio = limpiar_rut(rut)
    if len(rut_limpio) < 2:
        return rut_limpio
    
    cuerpo = rut_limpio[:-1]
    dv = rut_limpio[-1]
    
    # Formatea el cuerpo con puntos
    cuerpo_formateado = ""
    for i, c in enumerate(reversed(cuerpo)):
        if i > 0 and i % 3 == 0:
            cuerpo_formateado = "." + cuerpo_formateado
        cuerpo_formateado = c + cuerpo_formateado
        
    return f"{cuerpo_formateado}-{dv}"