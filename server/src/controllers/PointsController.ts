import {Request, Response} from 'express'
import knex from '../database/connection'

class PoitsController {

    async create(req:Request, res:Response) {
        const {
          name, 
          email, 
          whatsapp, 
          latitude, 
          longitude, 
          city, 
          uf,
          items
        } = req.body; 
      
        const trx = await knex.transaction();

        const point = {
            image: req.file.filename,
            name, 
            email, 
            whatsapp, 
            latitude, 
            longitude, 
            city, 
            uf
          }
      
        const insertedId = await trx('points').insert(point);
      
        const point_id = insertedId[0];
      
        const poitItems = items.split(',')
        .map((item: String) => Number(item.trim()))
        .map((item_id: Number) => {
          return {
            item_id,
            point_id,
          }
      
        });
      
        await trx('point_items').insert(poitItems);

        await trx.commit();
      
        return res.json({
            id: point_id,
            ... point,
        });
      }

    async show(req:Request, res:Response) {
        const {id} = req.params;

        const point = await knex('points').where('id', id).first();

        if(!point){
            return res.status(400).json({message:'Point not found'});
        }

        const serializedPoints ={
            ... point, 
            image_url: `http://192.168.15.4:3333/uploads/${point.image}`,
          };



        /**
         * Select * from items
         *  join point_items on items.id = point_items.item_id 
         * where point_items.point_id = {id}
         */

        const items = await knex('items')
        .join('point_items', 'items.id', '=', 'point_items.item_id')
        .where('point_items.point_id', id)
        .select('items.title');

        return res.json({point: serializedPoints, items});
    }

    async index(req:Request, res:Response) {
        const{city, uf, items} = req.query;

        const parsetItems = String(items)
        .split(',')
        .map(item => Number(item.trim()));

        const points = await knex('points')
        .join('point_items','points.id', '=', 'point_items.point_id')
        .whereIn('point_items.item_id', parsetItems)
        .where('city', String(city))
        .where('uf', String(uf))
        .distinct()
        .select('points.*');

        const serializedPoints = points.map(point => {
          return {
            ... point, 
            image_url: `http://192.168.15.4:3333/uploads/${point.image}`,
          };
        });

        return res.json(serializedPoints);
    }
    
}

export default PoitsController;