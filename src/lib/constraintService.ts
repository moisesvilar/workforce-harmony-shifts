/**
 * Servicio para analizar restricciones en lenguaje natural y convertirlas a formato JSON
 */

/**
 * Envía una restricción en lenguaje natural al servicio de análisis
 * @param constraintText El texto de la restricción en lenguaje natural
 * @returns La respuesta del servicio en formato JSON
 */
export const analyzeConstraint = async (constraintText: string): Promise<any> => {
  try {
    const response = await fetch('https://hook.eu2.make.com/3zezvmlp2i5et18ns991qyrbt9mncouu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ constraint: constraintText }),
    });

    if (!response.ok) {
      throw new Error(`Error al analizar la restricción: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error en el servicio de análisis de restricciones:', error);
    throw error;
  }
}; 