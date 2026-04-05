import type { PlanetName } from '../types';
import { REL_CSS, REL_ABBR } from '../constants';
import {
  getNaturalRelationship,
  getTemporaryRelationship,
  getCompoundRelationship,
} from '../astrology';
import PlanetMatrix from './PlanetMatrix';

interface Props {
  signs: Record<PlanetName, number>;
}

export default function RelationshipTable(props: Props) {
  return (
    <PlanetMatrix
      id="relationship-table"
      caption="Compound (Panchadha) Relationship Matrix"
      cell={(a, b) => {
        const nat = getNaturalRelationship(a, b);
        const temp = getTemporaryRelationship(props.signs[a], props.signs[b]);
        const comp = getCompoundRelationship(nat, temp);
        return (
          <td class={REL_CSS[comp]} title={`${comp} (nat: ${nat}, temp: ${temp})`}>
            {REL_ABBR[comp]}
          </td>
        );
      }}
    />
  );
}
