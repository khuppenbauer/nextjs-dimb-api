import * as turf from '@turf/turf'
import GeoJsonFeatureCollectionType from '../interfaces/geoJsonFeatureCollection';
import GeoJsonFeatureType from '../interfaces/geoJsonFeature';

const featureCollection = (features: GeoJsonFeatureType[]) => {
  const featureCollection: GeoJsonFeatureCollectionType = {
    type: 'FeatureCollection',
    features,
  }

  const bbox = turf.bbox(featureCollection);
  const center = turf.center(featureCollection);

  const geoJsonFeatureCollection: GeoJsonFeatureCollectionType = {
    ...featureCollection,
    properties: {
      center: center.geometry.coordinates,
      bbox,
    }
  }
  return geoJsonFeatureCollection;
}

export default featureCollection
