# AlphaValue Football

Primera versión del proyecto para cruzar oportunidades de AlphaMetri con estadísticas externas y construir un modelo propio.

## V1
- Carga manual de oportunidades de AlphaMetri.
- Guarda datos en `localStorage`.
- Lista y analiza oportunidades.
- Calcula probabilidad implícita, cuota justa y EV provisional.
- No depende de servidor.

## Próximos pasos
1. Conectar APWin mediante una fuente autorizada.
2. Investigar acceso autorizado/exportación de StatsHub.
3. Crear un backend para recolectar y almacenar estadísticas históricas.
4. Separar modelos por mercado: goles, córners, tarjetas, BTTS y hándicap.
5. Registrar resultados y hacer backtesting.
6. Construir ranking diario.
7. Automatizar la importación de datos de AlphaMetri si existe una API/exportación permitida.

## Importante
La probabilidad del modelo en esta V1 es deliberadamente provisional. No debe considerarse un sistema de apuestas validado hasta realizar backtesting con una muestra histórica suficiente.
