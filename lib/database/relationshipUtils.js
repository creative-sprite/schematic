// lib\database\relationshipUtils.js

/**
 * Updates references when a new relationship is created
 * @param {Object} sourceModel - The source Mongoose model (e.g., Site)
 * @param {string} sourceId - The ID of the source document
 * @param {string} sourceField - The field in the source that references the target (e.g., 'contacts')
 * @param {Object} targetModel - The target Mongoose model (e.g., Contact)
 * @param {string} targetId - The ID of the target document
 * @param {string} targetField - The field in the target that references the source (e.g., 'sites')
 * @returns {Promise<void>}
 */
export const createBidirectionalRelationship = async (
  sourceModel,
  sourceId,
  sourceField,
  targetModel,
  targetId,
  targetField
) => {
  try {
    // Update source document to include reference to target
    await sourceModel.findByIdAndUpdate(
      sourceId,
      { $addToSet: { [sourceField]: targetId } },
      { new: true }
    );

    // Update target document to include reference to source
    await targetModel.findByIdAndUpdate(
      targetId,
      { $addToSet: { [targetField]: sourceId } },
      { new: true }
    );

    console.log(
      `Created bidirectional relationship between ${sourceModel.modelName}(${sourceId}) and ${targetModel.modelName}(${targetId})`
    );
  } catch (error) {
    console.error("Error creating bidirectional relationship:", error);
    throw error;
  }
};

/**
 * Removes references when a relationship is deleted
 * @param {Object} sourceModel - The source Mongoose model (e.g., Site)
 * @param {string} sourceId - The ID of the source document
 * @param {string} sourceField - The field in the source that references the target (e.g., 'contacts')
 * @param {Object} targetModel - The target Mongoose model (e.g., Contact)
 * @param {string} targetId - The ID of the target document
 * @param {string} targetField - The field in the target that references the source (e.g., 'sites')
 * @returns {Promise<void>}
 */
export const removeBidirectionalRelationship = async (
  sourceModel,
  sourceId,
  sourceField,
  targetModel,
  targetId,
  targetField
) => {
  try {
    // Update source document to remove reference to target
    await sourceModel.findByIdAndUpdate(
      sourceId,
      { $pull: { [sourceField]: targetId } },
      { new: true }
    );

    // Update target document to remove reference to source
    await targetModel.findByIdAndUpdate(
      targetId,
      { $pull: { [targetField]: sourceId } },
      { new: true }
    );

    console.log(
      `Removed bidirectional relationship between ${sourceModel.modelName}(${sourceId}) and ${targetModel.modelName}(${targetId})`
    );
  } catch (error) {
    console.error("Error removing bidirectional relationship:", error);
    throw error;
  }
};

/**
 * Cleans up all references to an entity when it's deleted
 * @param {Object} model - The Mongoose model to delete from (e.g., Contact)
 * @param {string} entityId - The ID of the entity being deleted
 * @param {Array} relationships - Array of objects with related model info
 * @returns {Promise<void>}
 */
export const cleanupEntityReferences = async (
  model,
  entityId,
  relationships
) => {
  try {
    // Get the entity first to access its references
    const entity = await model.findById(entityId);
    
    if (!entity) {
      console.log(`Entity ${model.modelName}(${entityId}) not found for cleanup`);
      return;
    }
    
    // Process each relationship
    for (const rel of relationships) {
      const { relatedModel, entityField, relatedField } = rel;
      
      // Skip if the entity doesn't have any references in this field
      if (!entity[entityField] || entity[entityField].length === 0) {
        continue;
      }
      
      // For each reference ID in the entity's field
      for (const refId of entity[entityField]) {
        // Remove the bidirectional relationship
        await removeBidirectionalRelationship(
          model,
          entityId,
          entityField,
          relatedModel,
          refId,
          relatedField
        );
      }
    }
    
    console.log(`Cleaned up all references for ${model.modelName}(${entityId})`);
  } catch (error) {
    console.error("Error cleaning up entity references:", error);
    throw error;
  }
};

/**
 * Checks if a relationship already exists
 * @param {Object} sourceModel - The source Mongoose model (e.g., Site)
 * @param {string} sourceId - The ID of the source document
 * @param {string} sourceField - The field in the source that references the target (e.g., 'contacts')
 * @param {string} targetId - The ID of the target document
 * @returns {Promise<boolean>}
 */
export const relationshipExists = async (
  sourceModel,
  sourceId,
  sourceField,
  targetId
) => {
  try {
    // Check if the source document already references the target
    const source = await sourceModel.findById(sourceId);
    
    if (!source) {
      return false;
    }
    
    return source[sourceField] && source[sourceField].includes(targetId);
  } catch (error) {
    console.error("Error checking relationship existence:", error);
    throw error;
  }
};