import httpStatus from "http-status";
import type { TRequest, TResponse } from "../../../types/express.types";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendResponse } from "../../../utils/sendResponse";
import { serviceService, type ServiceService } from "./service.service";
import type {
  TCreateServicePayload,
  TListServicesQuery,
  TUpdateServicePayload,
} from "./service.validation";
import type { TRole } from "../../../../generated/prisma/enums";

class ServiceController {
  constructor(private serviceService: ServiceService) {}

  //--------------Create Service-------------
  createService = asyncHandler(async (req: TRequest, res: TResponse) => {
    const payload = req.body as TCreateServicePayload;
    const service = await this.serviceService.createService(
      req.user.id,
      payload,
    );

    sendResponse({
      res,
      status: httpStatus.CREATED,
      success: true,
      message: "Service created successfully",
      data: service,
    });
  });

  //--------------Update Service-------------
  updateService = asyncHandler(async (req: TRequest, res: TResponse) => {
    const serviceId = req.params.id as string;
    const userId = req.user.id as string;
    const payload = req.body as TUpdateServicePayload;
    const service = await this.serviceService.updateService(
      userId,
      serviceId,
      payload,
    );

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Service updated successfully",
      data: service,
    });
  });

  //--------------Delete Service-------------
  deleteService = asyncHandler(async (req: TRequest, res: TResponse) => {
    const serviceId = req.params.id as string;
    const userId = req.user.id as string;
    const role = req.user.role as TRole;
    const result = await this.serviceService.deleteService(
      userId,
      role,
      serviceId,
    );

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Service deleted successfully",
      data: result,
    });
  });

  //-------------Get Technician's Service-------------
  getMyServices = asyncHandler(async (req: TRequest, res: TResponse) => {
    const services = await this.serviceService.getMyServices(req.user.id);

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Your services fetched successfully",
      data: services,
    });
  });

  //--------------Get All Service-------------
  getAllServices = asyncHandler(async (req: TRequest, res: TResponse) => {
    const query = req.query as TListServicesQuery;
    const { items, meta } = await this.serviceService.getAllServices(query);

    sendResponse({
      res,
      status: httpStatus.OK,
      success: true,
      message: "Services fetched successfully",
      data: items,
      meta,
    });
  });
}

export const serviceController = new ServiceController(serviceService);
