# Parlem i Anem

A Catalan practice finder for Barcelona, served as static HTML, CSS, JavaScript and JSON.

Run `python3 -m http.server 8000` in the repository and open `http://localhost:8000/`. Run `node --test` for the catalog tests. The browser loads data and fonts from the site itself.

## Updating the catalog

Add or edit records in `data/places.json`. Use the official VxL sector ID, the public business address, and the source. Set `hoursStatus` to `unknown` when the hours cannot be verified. For verified hours use seven arrays starting on Monday and add a `verifiedAt` date only after reviewing the record. An interval may cross midnight. Use `24:00` for an interval ending at midnight. A place belongs to the CPNL practice list only when independently confirmed against that list. Coordinate pairs are latitude and longitude.

The current snapshot includes eight previously listed places. The group picker supports all VxL sectors. Adding more records depends on the owner's decision on reuse. Existing Google ratings are pending the owner's decision. No new ratings were collected.

## Origins and public data

- The [CPNL centre directory](https://www.cpnl.cat/xarxa/centres/) supplies the locally staged centre names, public addresses and map locations. The Eixample option uses existing URL identifier `612`; the CPNL detail record is `339`. Review reuse terms before publishing the expanded data.
- The address index and the added venue coordinates are adapted from [postal addresses](https://opendata-ajuntament.barcelona.cat/data/ca/dataset/taula-direle) and [street names](https://opendata-ajuntament.barcelona.cat/data/ca/dataset/nomenclator-bcn), Open Data BCN, Ajuntament de Barcelona, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The derived index joins the tables on street code, retains street names, house numbers and rounded coordinates, and removes unused fields. Rebuild with `python3 scripts/build-addresses.py streets.csv addresses.csv`. It is loaded only on the first address lookup.
- The original Eixample walking times are preserved. Other distances use straight-line distance with a walking factor and are labeled approximate. The device location is rounded in memory. Typed addresses and device coordinates stay out of the shared URL and outbound links. Maps can ask the visitor for a starting point when they open an external route.
- Lato is hosted locally under the [SIL Open Font License](fonts/OFL.txt).

CPNL/VxL reuse, existing Google ratings and hosting terms after transfer remain open decisions. The GitHub Pages project lives under a repository path. GitHub only honors robots.txt at the host root, so this copy is useful on root deployments.

## License

The original project code is available under the [MIT License](LICENSE). The Lato font and third-party data retain their own licenses and terms, as described above.
