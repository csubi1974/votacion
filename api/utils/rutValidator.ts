/**
 * Validador de RUT Chileno
 * Implementa algoritmo de validación de RUT chileno con dígito verificador
 */

/**
 * Limpia el RUT dejando solo números y letra verificadora
 */
export const cleanRut = (rut: string): string => {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
};

/**
 * Formatea el RUT con puntos y guión
 */
export const formatRut = (rut: string): string => {
  const clean = cleanRut(rut);
  const body = clean.slice(0, -1);
  const verifier = clean.slice(-1);
  
  if (body.length === 0) return clean;
  
  // Add dots every 3 digits from right to left
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedBody}-${verifier}`;
};

/**
 * Calcula el dígito verificador de un RUT
 */
export const calculateVerifier = (rut: string): string => {
  const clean = cleanRut(rut).slice(0, -1);
  let sum = 0;
  let multiplier = 2;
  
  // Process digits from right to left
  for (let i = clean.length - 1; i >= 0; i--) {
    sum += parseInt(clean[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = 11 - (sum % 11);
  
  if (remainder === 11) return '0';
  if (remainder === 10) return 'K';
  return remainder.toString();
};

/**
 * Valida si un RUT es válido
 */
export const validateRut = (rut: string): boolean => {
  if (!rut || rut.trim().length === 0) return false;
  
  const clean = cleanRut(rut);
  if (clean.length < 2) return false;
  
  const body = clean.slice(0, -1);
  const verifier = clean.slice(-1);
  
  // Check if body contains only numbers
  if (!/^\d+$/.test(body)) return false;
  
  // Check if verifier is valid (number or K)
  if (!/^[0-9K]$/.test(verifier)) return false;
  
  // Calculate expected verifier
  const expectedVerifier = calculateVerifier(clean);
  
  return verifier === expectedVerifier;
};

/**
 * Extrae el número de RUT sin dígito verificador
 */
export const extractRutNumber = (rut: string): number => {
  const clean = cleanRut(rut);
  const body = clean.slice(0, -1);
  return parseInt(body, 10);
};

/**
 * Extrae el dígito verificador
 */
export const extractVerifier = (rut: string): string => {
  const clean = cleanRut(rut);
  return clean.slice(-1);
};

/**
 * Genera un RUT válido aleatorio (para pruebas)
 */
export const generateRandomRut = (): string => {
  const number = Math.floor(Math.random() * 25000000) + 1000000;
  const tempRut = number.toString() + '0';
  const verifier = calculateVerifier(tempRut);
  return formatRut(number.toString() + verifier);
};

export default {
  cleanRut,
  formatRut,
  calculateVerifier,
  validateRut,
  extractRutNumber,
  extractVerifier,
  generateRandomRut,
};