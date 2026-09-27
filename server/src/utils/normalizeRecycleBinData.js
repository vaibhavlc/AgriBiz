/**
 * Recursively converts a Mongoose document or plain object into a clean,
 * BSON-safe, serializable object for storage in RecycleBinItem.originalData.
 *
 * Handles ObjectId, Decimal128, Date, Arrays, and plain objects while stripping
 * Mongoose internal properties ($__, isNew, $isDeleted, _doc, etc.).
 */
export const normalizeRecycleBinData = (data) => {
  if (data === null || data === undefined) {
    return data;
  }

  // If it's a Mongoose Document instance, convert to plain object first
  if (typeof data === 'object' && typeof data.toObject === 'function') {
    data = data.toObject({ getters: false, virtuals: false, transform: false });
  }

  // Handle Primitive Types
  if (typeof data !== 'object') {
    return data;
  }

  // Handle Date
  if (data instanceof Date) {
    return data.toISOString();
  }

  // Handle ObjectId or BSON Types (Decimal128, ObjectId, etc.)
  if (
    data._bsontype === 'ObjectID' ||
    data._bsontype === 'Decimal128' ||
    data.constructor?.name === 'ObjectId' ||
    data.constructor?.name === 'Decimal128'
  ) {
    return data.toString();
  }

  // Handle Array
  if (Array.isArray(data)) {
    return data.map((item) => normalizeRecycleBinData(item));
  }

  // Handle Plain Object
  const normalized = {};
  for (const [key, value] of Object.entries(data)) {
    // Strip Mongoose internal state fields
    if (key.startsWith('$') || key === '_doc' || key === '$__') {
      continue;
    }
    normalized[key] = normalizeRecycleBinData(value);
  }

  return normalized;
};
