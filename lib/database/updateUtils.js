// lib\database\updateUtils.js

/**
 * Updates many-to-many relationships for an entity
 * @param {Object} model - The Mongoose model being updated
 * @param {string} entityId - The ID of the entity being updated
 * @param {Object} updates - The update payload containing relationship arrays
 * @param {Array} relationshipConfig - Configuration for relationship handling
 * @returns {Promise<Object>} The updated entity
 */
export const updateEntityRelationships = async (
  model,
  entityId,
  updates,
  relationshipConfig
) => {
  try {
    // Get the current entity state
    const entity = await model.findById(entityId);
    
    if (!entity) {
      throw new Error(`${model.modelName} with ID ${entityId} not found`);
    }
    
    // Process each relationship defined in the config
    for (const config of relationshipConfig) {
      const { field, relatedModel, relatedField } = config;
      
      // Skip if this relationship field isn't in the updates
      if (!updates[field]) continue;
      
      // Convert array of IDs to strings for comparison
const newIds = new Set(updates[field].map(id => id.toString()));
const existingIds = new Set((entity[field] || []).map(id => id.toString()));

// Now the comparison will work correctly
const idsToAdd = [...newIds].filter(id => !existingIds.has(id));
const idsToRemove = [...existingIds].filter(id => !newIds.has(id));
      
      // Add new relationships
      for (const id of idsToAdd) {
        // Add reference from entity to related entity
        await model.findByIdAndUpdate(
          entityId,
          { $addToSet: { [field]: id } }
        );
        
        // Add reference from related entity to this entity
        await relatedModel.findByIdAndUpdate(
          id,
          { $addToSet: { [relatedField]: entityId } }
        );
      }
      
      // Remove old relationships
      for (const id of idsToRemove) {
        // Remove reference from entity to related entity
        await model.findByIdAndUpdate(
          entityId,
          { $pull: { [field]: id } }
        );
        
        // Remove reference from related entity to this entity
        await relatedModel.findByIdAndUpdate(
          id,
          { $pull: { [relatedField]: entityId } }
        );
      }
    }
    
    // Finally, update the entity with all the other fields
    const cleanUpdates = { ...updates };
    
    // Remove relationship arrays from the direct update
    // (we've handled them separately above)
    relationshipConfig.forEach(config => {
      delete cleanUpdates[config.field];
    });
    
    // Update the entity with the remaining fields
    if (Object.keys(cleanUpdates).length > 0) {
      await model.findByIdAndUpdate(entityId, cleanUpdates);
    }
    
    // Return the updated entity
    return await model.findById(entityId);
  } catch (error) {
    console.error(`Error updating ${model.modelName} relationships:`, error);
    throw error;
  }
};

/**
 * Legacy compatibility helper - updates single-reference relationships
 * @param {Object} model - The Mongoose model being updated
 * @param {string} entityId - The ID of the entity being updated
 * @param {Object} updates - The update payload
 * @param {Array} legacyConfig - Configuration for legacy relationships
 * @returns {Promise<void>}
 */
export const updateLegacyReferences = async (
  model,
  entityId,
  updates,
  legacyConfig
) => {
  try {
    // Get the current entity state
    const entity = await model.findById(entityId);
    
    if (!entity) {
      throw new Error(`${model.modelName} with ID ${entityId} not found`);
    }
    
    // Process each legacy relationship
    for (const config of legacyConfig) {
      const { field, relatedModel, relatedField } = config;
      
      // Skip if this field isn't in the updates
      if (updates[field] === undefined) continue;
      
      const newRefId = updates[field];
      const oldRefId = entity[field];
      
      // Skip if there's no change
      if (newRefId === oldRefId) continue;
      
      // If there was a previous reference, remove this entity from its array
      if (oldRefId) {
        await relatedModel.findByIdAndUpdate(
          oldRefId,
          { $pull: { [relatedField]: entityId } }
        );
      }
      
      // If there's a new reference, add this entity to its array
      if (newRefId) {
        await relatedModel.findByIdAndUpdate(
          newRefId,
          { $addToSet: { [relatedField]: entityId } }
        );
      }
    }
  } catch (error) {
    console.error(`Error updating legacy references for ${model.modelName}:`, error);
    throw error;
  }
};