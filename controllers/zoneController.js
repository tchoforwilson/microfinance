import * as factory from './handlerFactory.js';
import database from '../config/database.js';

const Zone = database.zone;

// fields considered for create and update
const fields = ['name', 'description', 'longitude', 'latitude', 'user'];

// exclude fields in query
const excludedFields = ['createdAt', 'updatedAt'];

export const createZone = factory.createOne(Zone, ...fields);
export const getAllZones = factory.getAll(Zone);
export const getZone = factory.getOne(Zone, ...excludedFields);
export const updateZone = factory.updateOne(Zone, ...fields);
export const deleteZone = factory.deleteOne(Zone);
