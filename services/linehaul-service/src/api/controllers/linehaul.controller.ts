import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { LinehaulService } from '../../application/services/linehaul.service';
import type {
  AddTripManifestInput,
  ArriveTripInput,
  AssignVehicleInput,
  CreateDriverInput,
  CreateHandoverInput,
  CreateTripInput,
  CreateVehicleInput,
  DepartTripInput,
  LinehaulHandover,
  LinehaulIncident,
  LinehaulSeal,
  LinehaulTrip,
  LinehaulTripManifest,
  ReceiveManifestInput,
  RecordSealInput,
  SealTripInput,
  ReportIncidentInput,
  Vehicle,
  Driver,
} from '../../domain/entities/linehaul.entity';

@Controller()
export class LinehaulController {
  constructor(private readonly linehaulService: LinehaulService) {}

  @Get('vehicles')
  listVehicles(): Promise<Vehicle[]> {
    return this.linehaulService.listVehicles();
  }

  @Post('vehicles')
  createVehicle(@Body() body: CreateVehicleInput): Promise<Vehicle> {
    return this.linehaulService.createVehicle(body);
  }

  @Get('drivers')
  listDrivers(): Promise<Driver[]> {
    return this.linehaulService.listDrivers();
  }

  @Post('drivers')
  createDriver(@Body() body: CreateDriverInput): Promise<Driver> {
    return this.linehaulService.createDriver(body);
  }

  @Get('trips')
  listTrips(@Query() query: {
    status?: string;
    originHubCode?: string;
    destinationHubCode?: string;
    vehicleId?: string;
    driverId?: string;
    manifestCode?: string;
  }): Promise<LinehaulTrip[]> {
    return this.linehaulService.listTrips(query);
  }

  @Get('trips/:id')
  getTripById(@Param('id') id: string): Promise<LinehaulTrip> {
    return this.linehaulService.getTripById(id);
  }

  @Post('trips')
  createTrip(@Body() body: CreateTripInput): Promise<LinehaulTrip> {
    return this.linehaulService.createTrip(body);
  }

  @Post('trips/:id/assign-vehicle')
  assignVehicle(
    @Param('id') id: string,
    @Body() body: AssignVehicleInput,
  ): Promise<LinehaulTrip> {
    return this.linehaulService.assignVehicle(id, body);
  }

  @Post('trips/:id/manifests')
  addManifest(
    @Param('id') id: string,
    @Body() body: AddTripManifestInput,
  ): Promise<LinehaulTripManifest> {
    return this.linehaulService.addManifest(id, body);
  }

  @Post('trips/:id/seals')
  recordSeal(
    @Param('id') id: string,
    @Body() body: RecordSealInput,
  ): Promise<LinehaulSeal> {
    return this.linehaulService.recordSeal(id, body);
  }

  @Post('trips/:id/seal')
  seal(
    @Param('id') id: string,
    @Body() body: SealTripInput,
  ): Promise<LinehaulTrip> {
    return this.linehaulService.seal(id, body);
  }

  @Post('trips/:id/depart')
  depart(
    @Param('id') id: string,
    @Body() body: DepartTripInput,
  ): Promise<LinehaulTrip> {
    return this.linehaulService.depart(id, body);
  }

  @Post('trips/:id/arrive')
  arrive(
    @Param('id') id: string,
    @Body() body: ArriveTripInput,
  ): Promise<LinehaulTrip> {
    return this.linehaulService.arrive(id, body);
  }

  @Post('trips/:id/receive-manifest')
  receiveManifest(
    @Param('id') id: string,
    @Body() body: ReceiveManifestInput,
  ): Promise<LinehaulTripManifest> {
    return this.linehaulService.receiveManifest(id, body);
  }

  @Post('trips/:id/complete')
  complete(@Param('id') id: string): Promise<LinehaulTrip> {
    return this.linehaulService.complete(id);
  }

  @Post('trips/:id/cancel')
  cancel(
    @Param('id') id: string,
    @Body() body: { note?: string | null },
  ): Promise<LinehaulTrip> {
    return this.linehaulService.cancel(id, body);
  }

  @Post('trips/:id/incidents')
  reportIncident(
    @Param('id') id: string,
    @Body() body: ReportIncidentInput,
  ): Promise<LinehaulIncident> {
    return this.linehaulService.reportIncident(id, body);
  }

  @Post('trips/:id/handovers')
  createHandover(
    @Param('id') id: string,
    @Body() body: CreateHandoverInput,
  ): Promise<LinehaulHandover> {
    return this.linehaulService.createHandover(id, body);
  }
}
