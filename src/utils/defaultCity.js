import { DEFAULT_CITY_ID } from "src/mocks/data";

export function toCityOption(city) {
  return {
    label: city.munCity,
    value: city.id,
    cityName: city.munCity,
    zipCode: city.zipCode
  };
}

export async function ensureDefaultCityOption(api, cityOptions) {
  if (cityOptions.value.some((opt) => opt.value === DEFAULT_CITY_ID)) return;

  try {
    const { data } = await api.get(`/cities/${DEFAULT_CITY_ID}`);
    cityOptions.value = [toCityOption(data), ...cityOptions.value];
  } catch {
    cityOptions.value = [
      {
        label: `City #${DEFAULT_CITY_ID}`,
        value: DEFAULT_CITY_ID,
        cityName: "",
        zipCode: null
      },
      ...cityOptions.value
    ];
  }
}

export function applyDefaultCity(form, cityOptions) {
  form.value.cityId = DEFAULT_CITY_ID;
  const selected = cityOptions.value.find((opt) => opt.value === DEFAULT_CITY_ID);
  if (!selected) return;
  form.value.city = selected.cityName;
  if (selected.zipCode) form.value.zip = String(selected.zipCode);
}
