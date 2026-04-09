/**
 * Validation utility to prevent empty or invalid data from being enqueued.
 */
export const ValidationHelper = {
  /**
   * Validates if a payload for a specific table has the minimum required fields.
   */
  isValidPayload: (table: string, payload: any): { valid: boolean; error?: string } => {
    if (!payload || typeof payload !== 'object') {
      return { valid: false, error: 'Payload is empty or not an object' };
    }

    // Generic check: Ensure at least some fields are not empty
    const nonEmptyValues = Object.entries(payload).filter(([_, value]) => {
      if (value === null || value === undefined || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    });

    if (nonEmptyValues.length === 0) {
      return { valid: false, error: 'Payload has no useful data' };
    }

    // Specific table validations
    switch (table) {
      case 'complaints':
        if (!payload.description || payload.description.trim() === '') {
          return { valid: false, error: 'Complaint description is required' };
        }
        if (!payload.customer_name || payload.customer_name.trim() === '') {
          return { valid: false, error: 'Customer name is required' };
        }
        break;

      case 'sales':
        if (!payload.customer_name || payload.customer_name.trim() === '') {
          return { valid: false, error: 'Customer name is required' };
        }
        if (!payload.serial_number || payload.serial_number.trim() === '') {
          return { valid: false, error: 'Serial number is required' };
        }
        break;

      case 'quotations':
        if (!payload.customer_name || payload.customer_name.trim() === '') {
          return { valid: false, error: 'Customer name is required' };
        }
        if (!payload.phone || payload.phone.trim() === '') {
          return { valid: false, error: 'Phone number is required' };
        }
        break;
      
      case 'field_visits':
        if (!payload.site_name || payload.site_name.trim() === '') {
          return { valid: false, error: 'Site name is required' };
        }
        if (!payload.phone || payload.phone.trim() === '') {
          return { valid: false, error: 'Contact phone is required' };
        }
        break;

      default:
        // For unknown tables, we rely on the generic check above
        break;
    }

    return { valid: true };
  }
};
