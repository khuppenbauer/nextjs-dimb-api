import type { NextApiRequest, NextApiResponse } from 'next';
import getConfig from 'next/config';
import geobuf from 'geobuf';
import Pbf from 'pbf';
import axios from 'axios';
import sql from '../../lib/db';
import featureCollection from '../../lib/geojson';
import GeoJsonFeatureType from '../../interfaces/geoJsonFeature';

interface Result {
  name: string;
  postcodes?: string;
  geometry: string;
}

const {
  publicRuntimeConfig: { metaDataUrl },
} = getConfig();

async function getAreas() {
  let metaData = null;
  const areas: {[key: string]: any} = {};
  try {
    const result = await axios({
      url: metaDataUrl,
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    metaData = result.data;
  } catch (error) {
    console.log(error);
  } finally {
    metaData?.areas.forEach((area: any) => {
      const { name } = area;
      const areaName = `DIMB ${name}`;
      areas[areaName] = area;
    });
  }
  return areas;
}

async function parseData(data: Result[]) {
  const areas = await getAreas();
  return data.map((item) => {
    const { name, postcodes, geometry } = item;
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

    const properties = areas[name] || { name, postcodes: postcodes?.split(',') };
    return {
      type: 'Feature',
      geometry: {
        type,
        coordinates: items,
      },
      properties,
    } as GeoJsonFeatureType;
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse | any
) {
  const { method, query } = req;

  if (method === 'GET') {
    let features = [];
    const simplify = query.simplify || 0.001;
    const format = query.format || 'json';
    
    if (query.pcode) {
      const data = await sql<Result[]>`
        SELECT dimb_ig as name
        FROM dimb_ig_plz
        ${
          query.pcode
            ? sql`WHERE plz = ${query.pcode}`
            : sql``
        }
      `;
      if (data && data.length > 0) {
        const { name } = data[0];
        query.ig = name;
        delete query.pcode;
      }
    }

    const data = await sql<Result[]>`
      SELECT dimb_ig as name, string_agg(dimb.plz, ',') as postcodes, ST_AsGeoJSON(ST_Simplify(ST_UNION(geometry), ${simplify})) AS geometry
      FROM dimb_ig_plz AS dimb
      JOIN dimb_opendatasoft_plz_germany AS geodata
      ON geodata.plz_code = dimb.plz
      WHERE dimb_ig != 'N.N.'
      ${
        query.bl
          ? sql`AND bundesland = ${query.bl}`
          : sql``
      }
      ${
        query.ig
          ? sql`AND dimb_ig = ${query.ig}`
          : sql``
      }
      GROUP BY dimb_ig
    `;
    if (data.length > 0) {
      features = await parseData(data);
    } else {
      return res.status(404).send('Not Found');
    }

    const geoJsonFeatureCollection = featureCollection(features); 

    switch (format) {
      case 'geobuf':
        let result = '';
        const buffer = geobuf.encode(geoJsonFeatureCollection, new Pbf());
        const bufView = new Uint16Array(buffer);
        for (let i = 0; i < bufView.length; i++) {
          result += String.fromCharCode(bufView[i]);
        }
        return res.status(200).send(result);
      default:
        return res.status(200).json(geoJsonFeatureCollection);
    }
  }
}
