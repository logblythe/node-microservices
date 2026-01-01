import { Request, Response } from "express";
import SearchPostModel from "../models/search.schema";
import { logger } from "../utils/logger";

export const searchController = async (req: Request, res: Response) => {
  logger.info("Search controller invoked");
  try {
    const query = req.query.q as string;

    const results = await SearchPostModel.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    logger.error("Error in search controller: %o", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
