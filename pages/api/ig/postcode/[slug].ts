import type { NextApiRequest, NextApiResponse } from 'next';
import sql from '../../../../lib/db';
import featureCollection from '../../../../lib/geojson';
import GeoJsonFeatureType from '../../../../interfaces/geoJsonFeature';

interface Result {
  plz: string;
  geometry: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse | any
) {
  const { method, query } = req;
  const simplify = query.simplify || 0.001;
  const { slug } = query;
  switch (method) {
    case 'GET':
      if (slug) {
        const data = await sql<Result[]>`
          SELECT plz, ST_AsGeoJSON(ST_Simplify(geometry, ${simplify})) AS geometry
          FROM dimb_ig_plz AS dimb
          JOIN dimb_opendatasoft_plz_germany AS geodata
          ON geodata.plz_code = dimb.plz
          WHERE dimb_ig = ${slug}
        `;
        if (data && data.length > 0) {
          const features: GeoJsonFeatureType[] = data.map((item) => {
            const { geometry, plz } = item;
            return {
              type: 'Feature',
              geometry: JSON.parse(geometry),
              properties: {
                name: plz,
              },
            }
          })
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
