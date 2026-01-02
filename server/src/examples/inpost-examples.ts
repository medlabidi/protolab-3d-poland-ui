import { getInPostService } from '../services/inpost.service';

/**
 * Example: Fetch all lockers in Krakow
 */
export async function exampleFetchLockers() {
  try {
    const inpostService = getInPostService();
    const lockers = await inpostService.getPoints('Krakow');
    
    console.log(`Found ${lockers.length} lockers in Krakow`);
    console.log('First locker:', lockers[0]);
    
    return lockers;
  } catch (error) {
    console.error('Failed to fetch lockers:', error);
  }
}

/**
 * Example: Get specific locker details
 */
export async function exampleGetLockerDetails(lockerCode: string) {
  try {
    const inpostService = getInPostService();
    const locker = await inpostService.getPointDetails(lockerCode);
    
    console.log('Locker details:', locker);
    
    return locker;
  } catch (error) {
    console.error(`Failed to fetch locker ${lockerCode}:`, error);
  }
}

/**
 * Example: Create a shipment to InPost Paczkomat
 */
export async function exampleCreatePaczkomatShipment(
  orderId: string,
  customerEmail: string,
  customerPhone: string,
  customerName: string,
  lockerCode: string,
  parcelDimensions: { length: number; width: number; height: number },
  parcelWeight: number
) {
  try {
    const inpostService = getInPostService();
    
    const shipment = await inpostService.createShipment({
      receiver: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      },
      parcels: [
        {
          dimensions: parcelDimensions, // in mm
          weight: {
            amount: parcelWeight, // in grams
          },
        },
      ],
      custom_attributes: {
        target_point: lockerCode, // e.g., "KRA01M"
      },
      service: 'inpost_locker_standard',
      reference: `ORDER-${orderId}`,
      comments: `ProtoLab 3D Print Order ${orderId}`,
    });
    
    console.log('Shipment created:', shipment);
    console.log('Tracking number:', shipment.tracking_number);
    console.log('Label URL:', shipment.label_url);
    
    return shipment;
  } catch (error) {
    console.error('Failed to create shipment:', error);
    throw error;
  }
}

/**
 * Example: Create a courier shipment to customer address
 */
export async function exampleCreateCourierShipment(
  orderId: string,
  customerData: {
    name: string;
    email: string;
    phone: string;
    street: string;
    buildingNumber: string;
    city: string;
    postCode: string;
  },
  parcelDimensions: { length: number; width: number; height: number },
  parcelWeight: number
) {
  try {
    const inpostService = getInPostService();
    
    const shipment = await inpostService.createShipment({
      receiver: {
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: {
          street: customerData.street,
          building_number: customerData.buildingNumber,
          city: customerData.city,
          post_code: customerData.postCode,
          country_code: 'PL',
        },
      },
      parcels: [
        {
          dimensions: parcelDimensions, // in mm
          weight: {
            amount: parcelWeight, // in grams
          },
        },
      ],
      service: 'inpost_courier_standard',
      reference: `ORDER-${orderId}`,
      comments: `ProtoLab 3D Print Order ${orderId}`,
    });
    
    console.log('Courier shipment created:', shipment);
    
    return shipment;
  } catch (error) {
    console.error('Failed to create courier shipment:', error);
    throw error;
  }
}

/**
 * Example: Track shipment
 */
export async function exampleTrackShipment(shipmentId: string) {
  try {
    const inpostService = getInPostService();
    
    const shipment = await inpostService.getShipment(shipmentId);
    console.log('Shipment status:', shipment.status);
    
    const events = await inpostService.getTrackingEvents(shipmentId);
    console.log('Tracking events:', events);
    
    return { shipment, events };
  } catch (error) {
    console.error('Failed to track shipment:', error);
  }
}

/**
 * Example: Download shipping label
 */
export async function exampleDownloadLabel(shipmentId: string) {
  try {
    const inpostService = getInPostService();
    
    const labelPdf = await inpostService.getLabel(shipmentId, 'pdf');
    
    // Save to file or send to frontend
    console.log('Label downloaded, size:', labelPdf.length, 'bytes');
    
    return labelPdf;
  } catch (error) {
    console.error('Failed to download label:', error);
  }
}

/**
 * Example: Complete order fulfillment workflow
 */
export async function exampleCompleteOrderFulfillment(
  orderId: string,
  deliveryMethod: 'inpost' | 'dpd',
  customerData: any,
  lockerCode?: string
) {
  try {
    console.log(`\n=== Processing Order ${orderId} ===`);
    
    // Example 3D print dimensions and weight
    const dimensions = {
      length: 150, // mm
      width: 100,  // mm
      height: 50,  // mm
    };
    const weight = 125; // grams
    
    let shipment;
    
    if (deliveryMethod === 'inpost' && lockerCode) {
      console.log('Creating Paczkomat shipment...');
      shipment = await exampleCreatePaczkomatShipment(
        orderId,
        customerData.email,
        customerData.phone,
        customerData.name,
        lockerCode,
        dimensions,
        weight
      );
    } else {
      console.log('Creating courier shipment...');
      shipment = await exampleCreateCourierShipment(
        orderId,
        customerData,
        dimensions,
        weight
      );
    }
    
    console.log('\n✅ Shipment created successfully!');
    console.log('📦 Tracking number:', shipment.tracking_number);
    
    // Download label
    console.log('\nDownloading shipping label...');
    const label = await exampleDownloadLabel(shipment.id);
    console.log('✅ Label downloaded');
    
    // TODO: Save shipment info to database
    // TODO: Send tracking email to customer
    // TODO: Update order status
    
    return {
      shipmentId: shipment.id,
      trackingNumber: shipment.tracking_number,
      labelUrl: shipment.label_url,
    };
  } catch (error) {
    console.error('Order fulfillment failed:', error);
    throw error;
  }
}

// For testing in development
if (require.main === module) {
  // Uncomment to test (requires valid API credentials)
  
  // exampleFetchLockers();
  
  // exampleGetLockerDetails('KRA01M');
  
  // exampleCompleteOrderFulfillment(
  //   'ORD123',
  //   'inpost',
  //   {
  //     name: 'Jan Kowalski',
  //     email: 'jan@example.com',
  //     phone: '+48123456789',
  //   },
  //   'KRA01M'
  // );
}
