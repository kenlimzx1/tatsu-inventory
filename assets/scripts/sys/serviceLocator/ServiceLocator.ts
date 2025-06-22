
type Constructor<T> = new (...args: any[]) => T;
export interface Service<T> { ref?: T | null };

/**
 * A service locator that allows services to be registered and retrieved.
 */
class ServiceLocator {
  private static instance: ServiceLocator | null;
  private services: Map<Constructor<any>, any> = new Map();

  static getInstance() {
    if (!this.instance || this.instance === null) {
      this.instance = new ServiceLocator();
    }
    return this.instance;
  }

  private constructor() { }

  /**
   * Registers a service with the service locator.
   *
   * @template T - The type of the service to register.
   * @param {Constructor<T>} ctor - The constructor of the service to register.
   * @param {T} service - The instance of the service to register.
   * @returns {ServiceLocator} The instance of the service locator for chaining.
   * @throws {Error} If the service is already registered.
   */
  public register<T>(ctor: Constructor<T>, service: T): ServiceLocator {
    if (this.services.has(ctor)) {
      throw new Error(`[Service Locator] Service ${ctor.name} is already registered.`);
    }
    this.services.set(ctor, service);
    return this;
  }

  /**
   * Gets a service from the service locator.
   *
   * @template T - The type of the service to get.
   * @param {Constructor<T>} ctor - The constructor of the service to get.
   * @returns {T} The instance of the service.
   * @throws {Error} If the service is not registered.
   */
  public get<T>(ctor: Constructor<T>): T {
    const service = this.services.get(ctor);
    if (!service) {
      throw new Error(`[Service Locator] Service ${ctor.name} not found.`);
    }
    return service as T;
  }

  /**
   * Unregisters a service from the service locator.
   *
   * @template T - The type of the service to unregister.
   * @param {Constructor<T>} ctor - The constructor of the service to unregister.
   * @returns {ServiceLocator} The instance of the service locator for chaining.
   * @throws {Error} If the service is not registered.
   */
  public unregister<T>(ctor: Constructor<T>): ServiceLocator {
    if (!this.services.has(ctor)) {
      throw new Error(`[Service Locator] Service ${ctor.name} is not registered.`);
    }
    this.services.delete(ctor);
    return this;
  }
}

export default ServiceLocator.getInstance();