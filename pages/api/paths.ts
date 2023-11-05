import type { NextApiRequest, NextApiResponse } from 'next';
import sql from '../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse | any
) {

  const { method, query: { property } } = req;

  if (method === 'GET') {    
    if (property) {
      const data = await sql`
        SELECT ${ sql(property) } FROM dimb_ig_plz WHERE dimb_ig != 'N.N.' GROUP BY ${ sql(property) }
      `;
      if (data && data.length > 0) {
        return res.status(200).send(data);
      }
    }
  }
  return res.status(500);
}
