import type { NextApiRequest, NextApiResponse } from 'next';
import sql from '../../lib/db';
import cache from '../../lib/cache';
import parseFeature from '../../lib/feature';

interface Result {
  name: string;
  postcodes?: string;
  geometry: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse | any
) {
  const { method, query, body } = req;

  if (method === 'POST') {
    const simplify: any = query.simplify || 0.001;
    if (body.items) {
      body.items.reduce(async (lastPromise: any, item: any) => {
        const postcodes = item.properties?.postcodes;
        const accum: any = await lastPromise;
        const data = await sql<Result[]>`
          SELECT ST_AsGeoJSON(ST_Simplify(ST_UNION(geometry), ${simplify})) AS geometry
          FROM dimb_opendatasoft_plz_germany
          WHERE name = ANY(${postcodes})
        `;
        if (data.length > 0) {
          const feature = {
            ...parseFeature(data[0]),
            ...item,
          };
          const name = item.properties?.name;
          if (name) {
            await cache(item.properties.name, feature.properties, feature, simplify);
          }
        }
        return [...accum, {}];
      }, Promise.resolve([]));
      res.status(200).send('Ok');
    }  
  }
  res.status(500).send('Error');
}
