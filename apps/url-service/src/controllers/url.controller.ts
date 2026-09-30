import { Request, Response } from "express";
import urlService from "../services/url.service.js";
import { ResponseSuccessStructure } from "@rocket/shared";
import { UrlStatus } from "../generated/prisma/enums.js";

class UrlController {
  async addUrl(req: Request, res: Response): Promise<void> {
    const reqUrl = req?.body?.url;
    const userId = req?.user?.id;

    const requiredObject = {
      userId,
      url: reqUrl,
    };
    const { url, isNewUrl } = await urlService.addNewURL(requiredObject);

    if (isNewUrl) {
      res
        .status(201)
        .json(
          new ResponseSuccessStructure(url, "new Url added successfully", 201),
        );
    } else {
      res
        .status(200)
        .json(
          new ResponseSuccessStructure(
            url,
            "Url already exists, recrawl scheduled",
            200,
          ),
        );
    }
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

  async deleteUrl(req: Request, res: Response): Promise<void> {
    const data = {
      userId: req.user.id,
      id: req.params.id as string,
    };
    await urlService.deleteURL(data);
    res
      .status(200)
      .json(
        new ResponseSuccessStructure(null, "Url deleted successfully", 200),
      );
  }

  async updateUrl(req: Request, res: Response): Promise<void> {
    const data = {
      userId: req.user.id,
      id: req.params.id as string,
      
    };
    await urlService.updateUrlStatus(data);
    res
      .status(200)
      .json(
        new ResponseSuccessStructure(null, "Url updated successfully", 200),
      );
  }
}

const urlController = new UrlController();

export default urlController;
