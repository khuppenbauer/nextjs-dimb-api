import GeoJsonFeatureType from '../interfaces/geoJsonFeature';

interface Result {
  name: string;
  postcodes?: string;
  geometry: string;
}

const feature = (data: Result) => {
  const { geometry } = data;
  const geoJson = JSON.parse(geometry);
  const { type, coordinates } = geoJson;
  let items = [];

  if (type === 'Polygon') {
    if (coordinates.length > 1) {
      const filteredCoordinates: number[][] = coordinates.reduce((prev: [], current: []) => {
        return prev.length > current.length ? prev : current;
      }, []);
      items = [filteredCoordinates];
    } else {
      items = coordinates;
    }
  } else if (type === 'MultiPolygon') {
    const filteredCoordinates: number[][][] = coordinates.map((polygonCoordinates: [][]) => {
      const res = polygonCoordinates.reduce((prev: [], current: []) => {
        return prev.length > current.length ? prev : current;
      }, []);
      return [res];
    });
    items = filteredCoordinates;
  }

  return {
    type: 'Feature',
    geometry: {
      type,
      coordinates: items,
    },
  } as GeoJsonFeatureType;
}

export default feature
