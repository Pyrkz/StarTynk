export abstract class BaseMapper<Entity, DTO> {
  abstract toDTO(entity: Entity): DTO;
  abstract toEntity(dto: DTO): Partial<Entity>;

  toDTOArray(entities: Entity[]): DTO[] {
    return entities.map(entity => this.toDTO(entity));
  }

  toEntityArray(dtos: DTO[]): Partial<Entity>[] {
    return dtos.map(dto => this.toEntity(dto));
  }

  // Helper to safely convert dates
  protected toISOString(date: Date | string | null | undefined): string | null {
    if (!date) return null;
    if (typeof date === 'string') return date;
    return date.toISOString();
  }

  // Helper to safely convert to Date
  protected toDate(dateString: string | null | undefined): Date | null {
    if (!dateString) return null;
    return new Date(dateString);
  }

  // Helper to exclude fields
  protected exclude<T, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K> {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
  }

  // Helper to pick fields
  protected pick<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  }

  // Helper to transform nested objects
  protected transformNested<T, R>(
    obj: T | null | undefined,
    transformer: (item: T) => R
  ): R | null {
    if (!obj) return null;
    return transformer(obj);
  }

  // Helper to transform arrays
  protected transformArray<T, R>(
    array: T[] | null | undefined,
    transformer: (item: T) => R
  ): R[] {
    if (!array) return [];
    return array.map(transformer);
  }
}