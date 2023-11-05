import type { NextApiRequest, NextApiResponse } from 'next';
import sql from '../../lib/db';
import featureCollection from '../../lib/geojson';
import GeoJsonFeatureType from '../../interfaces/geoJsonFeature';

interface Result {
  meta: any;
  geometry: GeoJsonFeatureType;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse | any
) {
  const { method, query } = req;
  const simplify: any = query.simplify || 0.015;
  switch (method) {
    case 'GET':
      const data = await sql<Result[]>`
        SELECT meta, geometry FROM dimb_ig WHERE simplified = ${simplify}
      `;
      const features: GeoJsonFeatureType[] = data.map((item) => {
        const { meta, geometry } = item;
        geometry.properties = meta;
        return geometry;
      })
      const geoJson = featureCollection(features);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      return res.status(200).send(geoJson);
    case 'OPTIONS':
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      return res.status(200).send('Ok');
      break;
    default:
      return res.status(500);
  }
}
