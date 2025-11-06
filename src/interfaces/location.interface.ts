export interface Province {
  code: string;
  name: string;
}

export interface Regency {
  code: string;
  name: string;
}

export interface District {
  code: string;
  name: string;
}

export interface Village {
  code: string;
  name: string;
}

export interface LocationResponse {
  data: Province[];
  meta: {
    administrative_area_level: number;
    updated_at: string;
  };
}
