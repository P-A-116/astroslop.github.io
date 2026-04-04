import {
  getCompoundRelationship,
  getNaturalRelationship,
  getTemporaryRelationship,
} from '../astrology';
import { REL_ABBR, REL_CSS } from '../constants';
import type { ChartData } from '../types';
import PlanetMatrix from './PlanetMatrix';

interface Props {
  data: ChartData;
}

export default function RelationshipTable(props: Props) {
  const { positions } = props.data;

  return (
    <PlanetMatrix
      id="relationship-table"
      cell={(a, b) => {
        const nat = getNaturalRelationship(a, b);
        const temp = getTemporaryRelationship(positions[a].sign, positions[b].sign);
        const comp = getCompoundRelationship(nat, temp);
        return <td class={REL_CSS[comp]} title={`${comp} (nat: ${nat}, temp: ${temp})`}>{REL_ABBR[comp]}</td>;
      }}
    />
  );
}
