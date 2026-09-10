import { Request, Response } from "express";
import urlService from "../services/url.service.js";
import { ResponseSuccessStructure } from "@rocket/shared";

class UrlController {
  async addUrl(req: Request, res: Response): Promise<void> {
    const reqUrl = req?.body?.url;
    const userId = req?.user?.id;
    const requiredObject = {
      userId,
      url: reqUrl,
    };
    const url = await urlService.addNewURL(requiredObject);
    res
      .status(201)
      .json(
        new ResponseSuccessStructure(url, "new Url added successfully", 201),
      );
  }

  async getUrlById(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const userId = req.user.id;

    const requiredObject = {
      id,
      userId,
    };
    const getUrlById = await urlService.getUrlById(requiredObject);

    res
      .status(200)
      .json(
        new ResponseSuccessStructure(getUrlById, "Selected url details!", 200),
      );
  }

  async getAllURls(req: Request, res: Response): Promise<void> {
    const userId = req.user.id;
    const { offset = 0, limit = 10 } = req.query;
    const getAllURlsOfUser = await urlService.getAllUrls({
      userId,
      offset: Number(offset),
      limit: Number(limit),
    });
    res
      .status(200)
      .json(
        new ResponseSuccessStructure(
          getAllURlsOfUser,
          "List of all urls!",
          200,
        ),
      );
  }
}
