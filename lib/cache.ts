import sql from '../lib/db';

const cache = async(name: string, meta: any, geometry: any, simplify: number) => {  
  const cache = await sql`
    INSERT INTO dimb_ig
      (name, meta, geometry, simplified)
    VALUES
      (${name}, ${meta}, ${geometry}, ${simplify})
    ON CONFLICT (name, simplified)
    DO UPDATE
    SET geometry = ${geometry}, meta = ${meta}
  `
  return cache
}

export default cache
