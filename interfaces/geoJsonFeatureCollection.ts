import type GeoJsonFeature from './geoJsonFeature';

type GeoJsonFeatureCollection = {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
  properties?: any;
};

export default GeoJsonFeatureCollection;
