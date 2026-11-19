"""Build the local Barcelona address index from two Open Data BCN CSV files."""
import csv
import json
import sys
from pathlib import Path

def rows(path):
    with open(path, newline="", encoding="utf-8-sig") as stream:
        yield from csv.DictReader(stream)

def build(streets_file, portals_file):
    streets = {}
    for row in rows(streets_file):
        name = row["NOM"]
        if not name:
            continue
        label = row["TIPUS_VIA"] + " " + row["NEXE_VIA"]
        if not label.endswith((" ", "'")):
            label += " "
        streets[row["CODI_VIA"].zfill(6)] = [label + name, name, {}]
    for row in rows(portals_file):
        street = streets.get(row["codi_carrer"].zfill(6))
        if not street or not row["numpost"].isdigit():
            continue
        try:
            location = [round(float(row["latitud_wgs84"]), 5), round(float(row["longitud_wgs84"]), 5)]
        except ValueError:
            continue
        if not (41.30 < location[0] < 41.50 and 2.05 < location[1] < 2.25):
            continue
        number = str(int(row["numpost"])) + row["llepost"].strip().lower()
        street[2].setdefault(number, location)
    return sorted([street for street in streets.values() if street[2]])

if __name__ == "__main__":
    output = Path(__file__).resolve().parent.parent / "data" / "addresses.json"
    output.write_text(json.dumps(build(*sys.argv[1:]), ensure_ascii=False, separators=(",", ":")) + "\n")
