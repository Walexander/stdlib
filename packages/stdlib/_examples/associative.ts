function main() {
  const map0 = VoteMap.empty().addVotes("A", 7)
  const map1 = VoteMap.empty().addVotes("A", 2).addVotes("C", 9)
  console.log("Total votes\n=======\n%s\n======", (map0 + map1).show)
  const maps = Chunk.from([map0, map1, VoteMap.empty().addVotes("X", 15)])
  const folded = maps.foldMap(VoteMap.AssociativeIdentity, identity)
  //           == pipe(maps, Associative.fold(VoteMap.Associative)(VoteMap.identity))
  console.log("Folded vote maps\n======\n%s\n======", folded.show)
}

type Topic = string
export class Votes {
  constructor(readonly value: number) {}
}
/** @tsplus implicit */
export const combineVotes = (x: Votes, y: Votes) =>
  new Votes(Associative.sum.combine(x.value, y.value))
export const votesAssociative = Derive<Associative<Votes>>()

// VoteMap
type VotesHashMap = HashMap<Topic, Votes>
/**
 * @tsplus type examples/VoteMap
 * @tsplus companion examples/VoteMap/Ops
 */
export class VoteMap {
  constructor(readonly map: VotesHashMap = HashMap.empty()) {}
}
// Constructors
/** @tsplus static examples/VoteMap/Ops empty */
export const empty = (): VoteMap => new VoteMap(HashMap.empty())
/** @tsplus static examples/VoteMap/Ops make */
export const make = (x: HashMap<Topic, Votes>): VoteMap => new VoteMap(x)

// Derive an associative instance for our HashMap
export const combineHashMaps = Derive<Associative<VotesHashMap>>().combine
/**
 * @tsplus implicit
 * @tsplus static examples/VoteMap/Ops combine
 * @tsplus operator examples/VoteMap +
 */
export const combine = (x: VoteMap, y: VoteMap): VoteMap =>
  VoteMap.make(combineHashMaps(x.map, y.map))
/** @tsplus static examples/VoteMap/Ops Associative */
export const voteMapAssoc = Derive<Associative<VoteMap>>()

// AssociativeIdentity
/** @tsplus static examples/VoteMap/Ops identity */
export const voteMapIdentity = empty()
/** @tsplus static examples/VoteMap/Ops AssociativeIdentity */
export const voteMapAssocId = AssociativeIdentity.fromAssociative(voteMapIdentity, voteMapAssoc)
// Fluent methods
/** @tsplus fluent examples/VoteMap addVote */
export const addVote = (self: VoteMap, topic: Topic): VoteMap => self.addVotes(topic, 1)
/** @tsplus fluent examples/VoteMap addVotes */
export const addVotes = (self: VoteMap, topic: Topic, count: number): VoteMap =>
  VoteMap.Associative.combine(
    self,
    VoteMap.make(HashMap.make(Tuple(topic, new Votes(count))))
  )
/** @tsplus getter examples/VoteMap show */
export const showVoteMaps = (self: VoteMap) =>
  self.map.foldMap(
    ImmutableArray.getAssociativeIdentity(),
    ({ tuple: [topic, votes] }) => ImmutableArray([topic, votes.value].join(" = "))
  ).toArray.join("\n")

main()
