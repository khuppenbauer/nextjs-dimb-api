import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import getConfig from 'next/config';
import sql from '../../lib/db';

const {
  publicRuntimeConfig: { baseUrl },
} = getConfig();

async function insertCache(name: string, meta: any, geometry: any, simplify: number) {  
  const cache = await sql`
    INSERT INTO dimb_ig
      (name, meta, geometry, simplified)
    VALUES
      (${name}, ${meta}, ${geometry}, ${simplify})
    ON CONFLICT (name, simplified)
    DO UPDATE
    SET geometry = ${geometry}
  `
  return cache
}

async function cacheAll(simplify: number) {
  const property = 'dimb_ig';
  const data = await sql`
    SELECT ${ sql(property) } FROM dimb_ig_plz GROUP BY ${ sql(property) } ORDER BY dimb_ig
  `;
  return data.reduce(async (lastPromise, item) => {
    const accum: any = await lastPromise;
    const { dimb_ig } = item;
    console.log(dimb_ig);
    const url = `${baseUrl}/api/areas?ig=${dimb_ig}&simplify=${simplify}`;
    const { data } = await axios.get(url);
    const { features } = data;
    await insertCache(dimb_ig, features[0].properties, features[0], simplify);
    return [...accum, {}];
  }, Promise.resolve([]));
}

async function cleanData() {  
  await sql`
    UPDATE dimb_ig_plz SET dimb_ig = TRIM(dimb_ig);
  `
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse | any
) {
  const { method, query } = req;

  if (method === 'GET') {
    const simplify: any = query.simplify || 0.01;
    await cleanData();
    await cacheAll(simplify);
    return res.status(200).send('Ok');
  }
  return res.status(500);
}
