import type GeoJsonPolygon from './geoJsonPolygon';
import type GeoJsonMultiPolygon from './geoJsonMultiPolygon';

type GeoJsonFeature = {
  type: 'Feature';
  geometry: GeoJsonPolygon | GeoJsonMultiPolygon;
  properties: {
    name: string;
  };
};

export default GeoJsonFeature;
