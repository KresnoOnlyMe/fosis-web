export default function MapFilters({
  filter,
  setFilter
}) {

  const toggle = (key) => {
    setFilter((current) => ({
      ...current,
      [key]: !current[key]
    }));
  };


  const labels = {
    engineer: "Engineer",
    vehicle: "Vehicle",
    site: "Site"
  };


  return (
    <div className="map-filter-box">

      {Object.keys(filter).map((key) => (

        <label
          key={key}
          className="map-filter-item"
        >

          <input
            type="checkbox"
            checked={filter[key]}
            onChange={() => toggle(key)}
          />

          <span>
            {labels[key]}
          </span>

        </label>

      ))}

    </div>
  );
}