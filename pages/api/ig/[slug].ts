import type { NextApiRequest, NextApiResponse } from 'next';
import sql from '../../../lib/db';
import featureCollection from '../../../lib/featureCollection';
import GeoJsonFeatureType from '../../../interfaces/geoJsonFeature';

interface Result {
  meta: any;
  geometry: GeoJsonFeatureType;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse | any
) {
  const { method, query } = req;
  const simplify = query.simplify || 0.005;
  const { slug } = query;
  switch (method) {
    case 'GET':
      if (slug) {
        let feature: GeoJsonFeatureType;
        const data = await sql<Result[]>`
          SELECT meta, geometry FROM dimb_ig WHERE name = ${slug} AND simplified = ${simplify}
        `;
        if (data && data.length > 0) {
          const { meta, geometry } = data[0];
          geometry.properties = meta;
          feature = geometry;
          const features = [feature];
          const geoJson = featureCollection(features);
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET');
          return res.status(200).send(geoJson);
        } else {
          return res.status(404).send('Not found');
        }
      }
    case 'OPTIONS':
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      return res.status(200).send('Ok');
    default:
      return res.status(500);    
  }
}
