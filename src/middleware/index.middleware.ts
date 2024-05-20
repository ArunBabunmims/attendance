import { NextFunction, Request, Response } from 'express'
import { UserSessionData } from 'types/redis';

export async function addSessionUserToRequest(req: Request, res: Response, next: NextFunction) {
 
  
  const headerData = req.headers['x-user-session'];
  
  if(!headerData) {
    return res.status(403).json({
      message: "Kindly try again after some time."
    })
  }

  const userData = JSON.parse(headerData as string) as UserSessionData;

  if(!userData) {
    return res.status(403).json({
      message: "Kindly try again after some time."
    })
  }

  res.locals.userSession = userData;
  next();
}