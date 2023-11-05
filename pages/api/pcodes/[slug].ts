import type { NextApiRequest, NextApiResponse } from 'next';
import sql from '../../../lib/db';

interface Result {
  geo_point_2d: {
    lat: number;
    lon: number;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse | any
) {
  const { method, query } = req;
  const { slug } = query;
  switch (method) {
    case 'GET':
      if (slug) {
        const data = await sql<Result[]>`
          SELECT geo_point_2d FROM dimb_opendatasoft_plz_germany WHERE name = ${slug}
        `;
        if (data && data.length > 0) {
          const { geo_point_2d } = data[0];
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET');
          return res.status(200).send(geo_point_2d);
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
