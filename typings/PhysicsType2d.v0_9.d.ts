/**
This software is provided 'as-is', without any express or implied
warranty. In no event will the authors be held liable for any damages
arising from the use of this software.

Permission is granted to anyone to use this software for any purpose,
including commercial applications, and to alter it and redistribute it
freely, subject to the following restrictions:

   1. The origin of this software must not be misrepresented; you must not
   claim that you wrote the original software. If you use this software
   in a product, an acknowledgment in the product documentation would be
   appreciated but is not required.

   2. Altered source versions must be plainly marked as such, and must not be
   misrepresented as being the original software.

   3. This notice may not be removed or altered from any source
   distribution.
*/
declare module PhysicsType2d {
    class BitFlag {
        constructor(initial?: number);
        private m_flags;
        public Set(flag: number): void;
        public Clear(flag: number): void;
        public IsSet(desiredFlags: number): boolean;
    }
}
declare module PhysicsType2d {
    class Utils {
        static log(format: string, ...optionalArgs: any[]): void;
        static AllocateArray<T>(size: number, create: () => T): T[];
    }
}
declare module PhysicsType2d {
    class MathExtensions {
        static IsValid(x: number): boolean;
        static InvSqrt(num: number): number;
        static Cross2x1(a: PhysicsType2d.Vector2, s: number): PhysicsType2d.Vector2;
        static Cross1x2(s: number, a: PhysicsType2d.Vector2): PhysicsType2d.Vector2;
        static Cross2x2(a: PhysicsType2d.Vector2, b: PhysicsType2d.Vector2): number;
        static Dot(a: PhysicsType2d.Vector2, b: PhysicsType2d.Vector2): number;
        static NextPowerOfTwo(num: number): number;
        static IsPowerOfTwo(x: number): boolean;
        static Clamp(a: number, low: number, high: number): number;
        static UInt8(x: number): number;
        static UInt16(x: number): number;
    }
}
declare module PhysicsType2d {
    function Assert(result: boolean, message?: string): void;
    class Constants {
        static MAX_FLOAT: number;
        static EPSILON: number;
        static PI: number;
    }
    class Settings {
        static isDebug: boolean;
        static maxManifoldPoints: number;
        static maxPolygonVertices: number;
        static aabbExtension: number;
        static aabbMultiplier: number;
        static linearSlop: number;
        static angularSlop: number;
        static polygonRadius: number;
        static maxSubSteps: number;
        static maxTOIContacts: number;
        static velocityThreshold: number;
        static maxLinearCorrection: number;
        static maxAngularCorrection: number;
        static maxTranslation: number;
        static maxTranslationSquared: number;
        static maxRotation: number;
        static maxRotationSquared: number;
        static baumgarte: number;
        static toiBaugarte: number;
        static timeToSleep: number;
        static linearSleepTolerance: number;
        static angularSleepTolerance: number;
    }
}
declare module PhysicsType2d {
    class Rotation {
        constructor();
        public S: number;
        public C: number;
        public Clone(): Rotation;
        static FromRadians(angleInRadians: number): Rotation;
        public Set(angleInRadians: number): void;
        public SetIdentity(): void;
        public GetAngle(): number;
        public GetXAxis(): PhysicsType2d.Vector2;
        public GetYAxis(): PhysicsType2d.Vector2;
        public Multiply(r: Rotation): Rotation;
        public MultiplyTranspose(r: Rotation): Rotation;
        public ApplyToVector2(v: PhysicsType2d.Vector2): PhysicsType2d.Vector2;
        public ApplyTransposeToVector2(v: PhysicsType2d.Vector2): PhysicsType2d.Vector2;
    }
}
declare module PhysicsType2d {
    class Transform {
        constructor();
        public p: PhysicsType2d.Vector2;
        public q: PhysicsType2d.Rotation;
        public Clone(): Transform;
        public Initialize(position: PhysicsType2d.Vector2, rotation: PhysicsType2d.Rotation): void;
        public SetIdentity(): void;
        public Set(position: PhysicsType2d.Vector2, angle: number): void;
        public Multiply(B: Transform): Transform;
        public MultiplyTranspose(B: Transform): Transform;
        public ApplyToVector2(v: PhysicsType2d.Vector2): PhysicsType2d.Vector2;
        public ApplyTransposeToVector2(v: PhysicsType2d.Vector2): PhysicsType2d.Vector2;
    }
}
declare module PhysicsType2d {
    interface IPoint2d {
        x: number;
        y: number;
    }
    interface ISize {
        width: number;
        height: number;
    }
    class Vector2 implements IPoint2d {
        constructor(x: number, y: number);
        static Zero(): Vector2;
        public x: number;
        public y: number;
        public AngleBetween(v2: IPoint2d): number;
        public Clone(): Vector2;
        public IsValid(): boolean;
        public Skew(): Vector2;
        public SetZero(): void;
        public Set(x: number, y: number): void;
        public Negative(): Vector2;
        public GetIndex(index: number): number;
        public SetIndex(index: number, value: number): void;
        public Add(v: IPoint2d): Vector2;
        public Subtract(v: IPoint2d): Vector2;
        public Multiply(a: number): Vector2;
        public Equals(v: IPoint2d): boolean;
        public Length(): number;
        public LengthSquared(): number;
        public Normalize(): number;
        public Dot(b: IPoint2d): number;
        public Cross(b: IPoint2d): number;
        public Rotate(q: PhysicsType2d.Rotation): Vector2;
        public RotateTranspose(q: PhysicsType2d.Rotation): Vector2;
        public DistanceFrom(b: IPoint2d): number;
        public DistanceFromSquared(b: IPoint2d): number;
        public Transform(T: PhysicsType2d.Transform): Vector2;
        public TransformTranspose(T: PhysicsType2d.Transform): Vector2;
        public Abs(): Vector2;
        public Clamp(low: IPoint2d, high: IPoint2d): Vector2;
        static Min(a: IPoint2d, b: IPoint2d): Vector2;
        static Max(a: IPoint2d, b: IPoint2d): Vector2;
        static DistanceBetween(a: IPoint2d, b: IPoint2d): number;
        static FromPoint(pt: IPoint2d): Vector2;
        public toString(): string;
    }
}
declare module PhysicsType2d {
    enum DrawFlags {
        SHAPE = 1,
        JOINT = 2,
        AABB = 4,
        PAIR = 8,
        CENTER_OF_MASS = 16,
    }
    interface IColor {
        R(): number;
        G(): number;
        B(): number;
        A(): number;
    }
    interface IDraw {
        FromRGB(r: number, g: number, b: number): IColor;
        SetFlag(flag: DrawFlags): void;
        ClearFlag(flag: DrawFlags): void;
        IsFlagSet(desiredFlags: DrawFlags): boolean;
        DrawPolygon(vertices: PhysicsType2d.Vector2[], color: IColor): void;
        DrawSolidPolygon(vertices: PhysicsType2d.Vector2[], color: IColor): void;
        DrawCircle(center: PhysicsType2d.Vector2, radius: number, color: IColor): void;
        DrawSolidCircle(center: PhysicsType2d.Vector2, radius: number, axis: PhysicsType2d.Vector2, color: IColor): void;
        DrawSegment(p1: PhysicsType2d.Vector2, p2: PhysicsType2d.Vector2, color: IColor): void;
        DrawTransform(xf: PhysicsType2d.Transform): void;
    }
}
declare module PhysicsType2d {
    class LinkedList<T> {
        constructor();
        private _head;
        private _count;
        public Add(value: T): void;
        public RemoveTop(): T;
        public Remove(data: T): boolean;
        public DeleteCurrent(iterator: IListIterator<T>): void;
        public Count(): number;
        public GetIterator(): IListIterator<T>;
    }
    interface IListIterator<T> {
        Reset(): any;
        MoveNext(): boolean;
        MovePrevious(): boolean;
        Current(): T;
    }
}
declare module PhysicsType2d {
    class Matrix2x2 {
        constructor();
        public EX: PhysicsType2d.Vector2;
        public EY: PhysicsType2d.Vector2;
        static FromColumns(c1: PhysicsType2d.Vector2, c2: PhysicsType2d.Vector2): Matrix2x2;
        static FromScalars(a11: number, a12: number, a21: number, a22: number): Matrix2x2;
        public Set(c1: PhysicsType2d.Vector2, c2: PhysicsType2d.Vector2): void;
        public SetIdentity(): void;
        public SetZero(): void;
        public GetInverse(): Matrix2x2;
        public Solve(b: PhysicsType2d.Vector2): PhysicsType2d.Vector2;
        public VectorMultiply(v: PhysicsType2d.Vector2): PhysicsType2d.Vector2;
        public VectorMultiplyTranspose(v: PhysicsType2d.Vector2): PhysicsType2d.Vector2;
        public Add(B: Matrix2x2): Matrix2x2;
        public Multiply(B: Matrix2x2): Matrix2x2;
        public MultiplyTranspose(B: Matrix2x2): Matrix2x2;
        public Abs(): Matrix2x2;
    }
}
declare module PhysicsType2d {
    class Vector3 {
        constructor(x: number, y: number, z: number);
        public x: number;
        public y: number;
        public z: number;
        public SetZero(): void;
        public Set(x: number, y: number, z: number): void;
        public Negative(): Vector3;
        public Add(v: Vector3): Vector3;
        public Subtract(v: Vector3): Vector3;
        public Multiply(a: number): Vector3;
        public Dot(b: Vector3): number;
        public Cross(b: Vector3): Vector3;
        public Abs(): Vector3;
    }
}
declare module PhysicsType2d {
    class Matrix3x3 {
        constructor();
        public EX: PhysicsType2d.Vector3;
        public EY: PhysicsType2d.Vector3;
        public EZ: PhysicsType2d.Vector3;
        public FromColumns(c1: PhysicsType2d.Vector3, c2: PhysicsType2d.Vector3, c3: PhysicsType2d.Vector3): void;
        public SetZero(): void;
        public Solve3x3(b: PhysicsType2d.Vector3): PhysicsType2d.Vector3;
        public Solve2x2(b: PhysicsType2d.Vector2): PhysicsType2d.Vector2;
        public GetInverse22(): Matrix3x3;
        public GetSymInverse33(): Matrix3x3;
        public Vector3Multiply(v: PhysicsType2d.Vector3): PhysicsType2d.Vector3;
        public Vector2Multiply(v: PhysicsType2d.Vector2): PhysicsType2d.Vector2;
    }
}
declare module PhysicsType2d {
    class RopeDefinition {
        constructor();
        public VertexCount(): number;
        public vertices: PhysicsType2d.Vector2[];
        public masses: number[];
        public gravity: PhysicsType2d.Vector2;
        public damping: number;
        public k2: number;
        public k3: number;
    }
    class Rope {
        constructor();
        public Initialize(def: RopeDefinition): void;
        public Step(h: number, iterations: number): void;
        public GetVertexCount(): number;
        public GetVertices(): PhysicsType2d.Vector2[];
        public Draw(draw: PhysicsType2d.IDraw, c: PhysicsType2d.IColor): void;
        public SetAngle(angle: number): void;
        private SolveC2();
        private SolveC3();
        private _ps;
        private _p0s;
        private _vs;
        private _ims;
        private _Ls;
        private _as;
        private _gravity;
        private _damping;
        private _k2;
        private _k3;
    }
}
declare module PhysicsType2d {
    class Sweep {
        constructor();
        public Clone(): Sweep;
        public GetTransform(beta: number): PhysicsType2d.Transform;
        public Advance(alpha: number): void;
        public Normalize(): void;
        public localCenter: PhysicsType2d.Vector2;
        public c0: PhysicsType2d.Vector2;
        public c: PhysicsType2d.Vector2;
        public a0: number;
        public a: number;
        public alpha0: number;
    }
}
declare module PhysicsType2d {
    class Timer {
        constructor();
        public Reset(): void;
        public GetMilliseconds(): number;
        private m_start;
    }
}
declare module PhysicsType2d.Collision {
    enum ContactFeatureType {
        VERTEX = 0,
        FACE = 1,
    }
    class ContactFeature {
        public indexA: number;
        public indexB: number;
        public typeA: ContactFeatureType;
        public typeB: ContactFeatureType;
    }
    class ContactID {
        public cf: ContactFeature;
        public key: number;
    }
}
declare module PhysicsType2d.Collision {
    class ClipVertex {
        public v: PhysicsType2d.Vector2;
        public id: Collision.ContactID;
    }
    class RayCastInput {
        public p1: PhysicsType2d.Vector2;
        public p2: PhysicsType2d.Vector2;
        public maxFraction: number;
    }
    class RayCastOutput {
        public normal: PhysicsType2d.Vector2;
        public fraction: number;
    }
    class ManifoldPoint {
        public localPoint: PhysicsType2d.Vector2;
        public normalImpulse: number;
        public tangentImpulse: number;
        public id: Collision.ContactID;
    }
    enum ManifoldType {
        CIRCLES = 0,
        FACE_A = 1,
        FACE_B = 2,
    }
    class Manifold {
        public points: ManifoldPoint[];
        public localNormal: PhysicsType2d.Vector2;
        public localPoint: PhysicsType2d.Vector2;
        public type: ManifoldType;
    }
}
declare module PhysicsType2d.Collision {
    class AxisAlignedBoundingBox {
        public Clone(): AxisAlignedBoundingBox;
        public IsValid(): boolean;
        public GetCenter(): PhysicsType2d.Vector2;
        public GetExtents(): PhysicsType2d.Vector2;
        public GetPerimeter(): number;
        public CombineWith(aabb: AxisAlignedBoundingBox): void;
        public Combine(aabb1: AxisAlignedBoundingBox, aabb2: AxisAlignedBoundingBox): void;
        public Contains(aabb: AxisAlignedBoundingBox): boolean;
        public RayCast(input: Collision.RayCastInput): Collision.RayCastOutput;
        public lowerBound: PhysicsType2d.Vector2;
        public upperBound: PhysicsType2d.Vector2;
        public TestOverlap(b: AxisAlignedBoundingBox): boolean;
    }
}
declare module PhysicsType2d.Collision {
    enum TreeConstants {
        NULL_NODE = -1,
    }
    class TreeNode {
        public Clone(): TreeNode;
        public IsLeaf(): boolean;
        private _link;
        public parent(value?: number): number;
        public next(value?: number): number;
        constructor();
        public aabb: Collision.AxisAlignedBoundingBox;
        public userData: any;
        public child1: number;
        public child2: number;
        public height: number;
    }
}
declare module PhysicsType2d.Collision {
    interface IQueryListener {
        QueryCallback(proxyId: number): boolean;
    }
    interface IProxyHitCallback {
        RayCastCallback(input: Collision.RayCastInput, proxyId: number): number;
    }
    class DynamicTree {
        constructor();
        public CreateProxy(aabb: Collision.AxisAlignedBoundingBox, userData: any): number;
        public DestroyProxy(proxyId: number): void;
        public MoveProxy(proxyId: number, aabb: Collision.AxisAlignedBoundingBox, displacement: PhysicsType2d.Vector2): boolean;
        public GetUserData(proxyId: number): any;
        public GetFatAABB(proxyId: number): Collision.AxisAlignedBoundingBox;
        public Query(listener: IQueryListener, aabb: Collision.AxisAlignedBoundingBox): void;
        public RayCast(callback: IProxyHitCallback, input: Collision.RayCastInput): void;
        public Validate(): void;
        public GetHeight(): number;
        public GetMaxBalance(): number;
        public GetAreaRatio(): number;
        public RebuildBottomUp(): void;
        private AllocateNode();
        private FreeNode(nodeId);
        private InsertLeaf(leaf);
        private RemoveLeaf(leaf);
        private Balance(iA);
        private ComputeHeight();
        private ComputeHeightAtNode(nodeId);
        private ValidateStructure(index);
        private ValidateMetrics(index);
        private m_root;
        private m_nodes;
        private m_nodeCount;
        private m_nodeCapacity;
        private m_freeList;
        private m_path;
        private m_insertionCount;
    }
}
declare module PhysicsType2d.Collision {
    class Pair {
        constructor();
        public proxyIdA: number;
        public proxyIdB: number;
        public next: number;
        static LessThan(pair1: Pair, pair2: Pair): number;
    }
    enum BroadPhaseConstants {
        NULL_PROXY = -1,
    }
    interface IPairCallback {
        AddPair(proxyUserDataA: any, proxyUserDataB: any): void;
    }
    class BroadPhase implements Collision.IQueryListener {
        constructor();
        public CreateProxy(aabb: Collision.AxisAlignedBoundingBox, userData: any): number;
        public DestroyProxy(proxyId: number): void;
        public MoveProxy(proxyId: number, aabb: Collision.AxisAlignedBoundingBox, displacement: PhysicsType2d.Vector2): void;
        public TouchProxy(proxyId: number): void;
        public GetFatAABB(proxyId: number): Collision.AxisAlignedBoundingBox;
        public GetUserData(proxyId: number): any;
        public TestOverlap(proxyIdA: number, proxyIdB: number): boolean;
        public GetProxyCount(): number;
        public UpdatePairs(callback: IPairCallback): void;
        public Query(callback: Collision.IQueryListener, aabb: Collision.AxisAlignedBoundingBox): void;
        public RayCast(callback: any, input: Collision.RayCastInput): void;
        public GetTreeHeight(): number;
        public GetTreeBalance(): number;
        public GetTreeQuality(): number;
        private BufferMove(proxyId);
        private UnBufferMove(proxyId);
        public QueryCallback(proxyId: number): boolean;
        private m_tree;
        private m_moveBuffer;
        private m_pairBuffer;
        private m_queryProxyId;
        private m_proxyCount;
    }
}
declare module PhysicsType2d.Collision.Shapes {
    class MassData {
        public mass: number;
        public center: PhysicsType2d.Vector2;
        public I: number;
    }
}
declare module PhysicsType2d.Collision.Shapes {
    enum ShapeType {
        CIRCLE = 0,
        EDGE = 1,
        POLYGON = 2,
        CHAIN = 3,
        COUNT = 4,
    }
    interface IShape {
        Clone(): IShape;
        GetType(): ShapeType;
        GetChildCount(): number;
        TestPoint(xf: PhysicsType2d.Transform, p: PhysicsType2d.Vector2): boolean;
        RayCast(input: Collision.RayCastInput, transform: PhysicsType2d.Transform, childIndex: number): Collision.RayCastOutput;
        ComputeAABB(xf: PhysicsType2d.Transform, childIndex: number): Collision.AxisAlignedBoundingBox;
        ComputeMass(density: number): Shapes.MassData;
        GetRadius(): number;
    }
}
declare module PhysicsType2d.Collision.Shapes {
    class CircleShape implements Shapes.IShape {
        constructor();
        public m_p: PhysicsType2d.Vector2;
        public m_radius: number;
        public GetRadius(): number;
        public Clone(): Shapes.IShape;
        public GetType(): Shapes.ShapeType;
        public GetChildCount(): number;
        public TestPoint(transform: PhysicsType2d.Transform, p: PhysicsType2d.Vector2): boolean;
        public RayCast(input: Collision.RayCastInput, transform: PhysicsType2d.Transform, childIndex: number): Collision.RayCastOutput;
        public ComputeAABB(transform: PhysicsType2d.Transform, childIndex: number): Collision.AxisAlignedBoundingBox;
        public ComputeMass(density: number): Shapes.MassData;
        public GetSupport(d: PhysicsType2d.Vector2): number;
        public GetSupportVertex(d: PhysicsType2d.Vector2): PhysicsType2d.Vector2;
        public GetVertexCount(): number;
        public GetVertex(index: number): PhysicsType2d.Vector2;
    }
}
declare module PhysicsType2d.Collision.Shapes {
    class PolygonShape implements Shapes.IShape {
        constructor();
        public m_radius: number;
        public m_centroid: PhysicsType2d.Vector2;
        public m_vertices: PhysicsType2d.Vector2[];
        public m_normals: PhysicsType2d.Vector2[];
        public GetRadius(): number;
        public Clone(): Shapes.IShape;
        public GetType(): Shapes.ShapeType;
        public GetChildCount(): number;
        public TestPoint(xf: PhysicsType2d.Transform, p: PhysicsType2d.Vector2): boolean;
        public RayCast(input: Collision.RayCastInput, xf: PhysicsType2d.Transform, childIndex: number): Collision.RayCastOutput;
        public ComputeAABB(xf: PhysicsType2d.Transform, childIndex: number): Collision.AxisAlignedBoundingBox;
        public ComputeMass(density: number): Shapes.MassData;
        public GetVertex(index: number): PhysicsType2d.Vector2;
        public SetAsBoxAtOrigin(hx: number, hy: number): void;
        public SetAsBox(hx: number, hy: number, center: PhysicsType2d.Vector2, angle: number): void;
        static ComputeCentroid(vs: PhysicsType2d.Vector2[]): PhysicsType2d.Vector2;
        public Set(vertices: PhysicsType2d.Vector2[]): void;
    }
}
declare module PhysicsType2d.Collision {
    function CollideCircles(manifold: Manifold, circleA: Shapes.CircleShape, xfA: PhysicsType2d.Transform, circleB: Shapes.CircleShape, xfB: PhysicsType2d.Transform): Manifold;
    function CollidePolygonAndCircle(manifold: Manifold, polygonA: Shapes.PolygonShape, xfA: PhysicsType2d.Transform, circleB: Shapes.CircleShape, xfB: PhysicsType2d.Transform): Manifold;
}
declare module PhysicsType2d.Collision.Shapes {
    class EdgeShape implements Shapes.IShape {
        constructor();
        public m_radius: number;
        public m_vertex1: PhysicsType2d.Vector2;
        public m_vertex2: PhysicsType2d.Vector2;
        public m_vertex0: PhysicsType2d.Vector2;
        public m_vertex3: PhysicsType2d.Vector2;
        public m_hasVertex0: boolean;
        public m_hasVertex3: boolean;
        public GetRadius(): number;
        public Clone(): Shapes.IShape;
        public GetType(): Shapes.ShapeType;
        public GetChildCount(): number;
        public TestPoint(xf: PhysicsType2d.Transform, p: PhysicsType2d.Vector2): boolean;
        public RayCast(input: Collision.RayCastInput, xf: PhysicsType2d.Transform, childIndex: number): Collision.RayCastOutput;
        public ComputeAABB(xf: PhysicsType2d.Transform, childIndex: number): Collision.AxisAlignedBoundingBox;
        public ComputeMass(density: number): Shapes.MassData;
        public Set(v1: PhysicsType2d.Vector2, v2: PhysicsType2d.Vector2): void;
    }
}
declare module PhysicsType2d.Collision.Shapes {
    class ChainShape implements Shapes.IShape {
        constructor();
        public m_radius: number;
        public m_vertices: PhysicsType2d.Vector2[];
        public m_prevVertex: PhysicsType2d.Vector2;
        public m_nextVertex: PhysicsType2d.Vector2;
        public m_hasPrevVertex: boolean;
        public m_hasNextVertex: boolean;
        public Clone(): Shapes.IShape;
        public GetRadius(): number;
        public GetType(): Shapes.ShapeType;
        public CreateLoop(vertices: PhysicsType2d.Vector2[]): void;
        public CreateChain(vertices: PhysicsType2d.Vector2[]): void;
        public SetPrevVertex(prevVertex: PhysicsType2d.Vector2): void;
        public SetNextVertex(nextVertex: PhysicsType2d.Vector2): void;
        public GetChildEdge(index: number): Shapes.EdgeShape;
        public GetChildCount(): number;
        public TestPoint(xf: PhysicsType2d.Transform, p: PhysicsType2d.Vector2): boolean;
        public RayCast(input: Collision.RayCastInput, xf: PhysicsType2d.Transform, childIndex: number): Collision.RayCastOutput;
        public ComputeAABB(xf: PhysicsType2d.Transform, childIndex: number): Collision.AxisAlignedBoundingBox;
        public ComputeMass(density: number): Shapes.MassData;
    }
}
declare module PhysicsType2d.Collision {
    class DistanceProxy {
        constructor();
        public Clone(): DistanceProxy;
        public Set(shape: Collision.Shapes.IShape, index?: number): void;
        public GetSupport(d: PhysicsType2d.Vector2): number;
        public GetSupportVertex(d: PhysicsType2d.Vector2): PhysicsType2d.Vector2;
        public GetVertexCount(): number;
        public GetVertex(index: number): PhysicsType2d.Vector2;
        public m_vertices: PhysicsType2d.Vector2[];
        public m_radius: number;
    }
    class SimplexCache {
        public metric: number;
        private index;
        public Count(): number;
        public Clear(): void;
        public AddIndices(iA: number, iB: number): void;
        public GetA(i: number): number;
        public GetB(i: number): number;
        constructor();
        public Clone(): SimplexCache;
    }
    class DistanceInput {
        public Clone(): DistanceInput;
        public proxyA: DistanceProxy;
        public proxyB: DistanceProxy;
        public transformA: PhysicsType2d.Transform;
        public transformB: PhysicsType2d.Transform;
        public useRadii: boolean;
    }
    class DistanceOutput {
        public Clone(): DistanceOutput;
        public pointA: PhysicsType2d.Vector2;
        public pointB: PhysicsType2d.Vector2;
        public distance: number;
        public iterations: number;
    }
    function Distance(cache: SimplexCache, input: DistanceInput): DistanceOutput;
    class gjk {
        static Calls: number;
        static Iters: number;
        static MaxIters: number;
    }
}
declare module PhysicsType2d.Collision {
    enum PointState {
        NULL = 0,
        ADD = 1,
        PERSIST = 2,
        REMOVE = 3,
    }
    interface TransitionStates {
        state1: PointState[];
        state2: PointState[];
    }
    function GetPointStates(manifold1: Manifold, manifold2: Manifold): TransitionStates;
    function ClipSegmentToLine(vIn: ClipVertex[], normal: PhysicsType2d.Vector2, offset: number, vertexIndexA: number): ClipVertex[];
    function TestOverlap(shapeA: Shapes.IShape, indexA: number, shapeB: Shapes.IShape, indexB: number, xfA: PhysicsType2d.Transform, xfB: PhysicsType2d.Transform): boolean;
}
declare module PhysicsType2d.Collision {
    function CollideEdgeAndCircle(manifold: Manifold, edgeA: Shapes.EdgeShape, xfA: PhysicsType2d.Transform, circleB: Shapes.CircleShape, xfB: PhysicsType2d.Transform): Manifold;
    function CollideEdgeAndPolygon(manifold: Manifold, edgeA: Shapes.EdgeShape, xfA: PhysicsType2d.Transform, polygonB: Shapes.PolygonShape, xfB: PhysicsType2d.Transform): Manifold;
}
declare module PhysicsType2d.Collision {
    function CollidePolygons(manifold: Manifold, polyA: Shapes.PolygonShape, xfA: PhysicsType2d.Transform, polyB: Shapes.PolygonShape, xfB: PhysicsType2d.Transform): Manifold;
}
declare module PhysicsType2d.Collision {
    class TOIInput {
        public proxyA: Collision.DistanceProxy;
        public proxyB: Collision.DistanceProxy;
        public sweepA: PhysicsType2d.Sweep;
        public sweepB: PhysicsType2d.Sweep;
        public tMax: number;
    }
    enum OutputState {
        UNKNOWN = 0,
        FAILED = 1,
        OVERLAPPED = 2,
        TOUCHING = 3,
        SEPARATED = 4,
    }
    class TOIOutput {
        public state: OutputState;
        public t: number;
    }
    class toi {
        static Calls: number;
        static Iters: number;
        static MaxIters: number;
        static RootIters: number;
        static MaxRootIters: number;
        static Time: number;
        static MaxTime: number;
    }
    function TimeOfImpact(input: TOIInput): TOIOutput;
}
declare module PhysicsType2d.Collision {
    class WorldManifold {
        constructor();
        public Initialize(manifold: Collision.Manifold, xfA: PhysicsType2d.Transform, radiusA: number, xfB: PhysicsType2d.Transform, radiusB: number): void;
        public normal: PhysicsType2d.Vector2;
        public points: PhysicsType2d.Vector2[];
    }
}
declare module PhysicsType2d.Dynamics {
    enum BodyType {
        STATIC = 0,
        KINEMATIC = 1,
        DYNAMIC = 2,
    }
    enum BodyFlags {
        ISLAND = 1,
        AWAKE = 2,
        AUTO_SLEEP = 4,
        BULLET = 8,
        FIXED_ROTATION = 16,
        ACTIVE = 32,
        TOI = 64,
    }
    class BodyDefinition {
        constructor();
        public Clone(): BodyDefinition;
        public type: BodyType;
        public position: PhysicsType2d.Vector2;
        public angle: number;
        public linearVelocity: PhysicsType2d.Vector2;
        public angularVelocity: number;
        public linearDamping: number;
        public angularDamping: number;
        public allowSleep: boolean;
        public awake: boolean;
        public fixedRotation: boolean;
        public bullet: boolean;
        public active: boolean;
        public userData: any;
        public gravityScale: number;
    }
}
declare module PhysicsType2d.Dynamics {
    class Filter {
        constructor();
        public Clone(): Filter;
        public categoryBits: number;
        public maskBits: number;
        public groupIndex: number;
    }
}
declare module PhysicsType2d.Dynamics {
    class FixtureDefinition {
        constructor();
        public Clone(): FixtureDefinition;
        public shape: PhysicsType2d.Collision.Shapes.IShape;
        public userData: any;
        public friction: number;
        public restitution: number;
        public density: number;
        public isSensor: boolean;
        public filter: Dynamics.Filter;
    }
}
declare module PhysicsType2d.Dynamics {
    class FixtureProxy {
        constructor(fixture: Fixture, aabb: PhysicsType2d.Collision.AxisAlignedBoundingBox);
        public Clone(): FixtureProxy;
        public aabb: PhysicsType2d.Collision.AxisAlignedBoundingBox;
        public fixture: Fixture;
        public childIndex: number;
        public proxyId: number;
    }
    class Fixture {
        constructor();
        public GetType(): PhysicsType2d.Collision.Shapes.ShapeType;
        public GetShape(): PhysicsType2d.Collision.Shapes.IShape;
        public SetSensor(sensor: boolean): void;
        public IsSensor(): boolean;
        public SetFilterData(filter: Dynamics.Filter): void;
        public GetFilterData(): Dynamics.Filter;
        public Refilter(): void;
        public GetBody(): Dynamics.Body;
        public GetUserData(): any;
        public SetUserData(data: any): void;
        public TestPoint(p: PhysicsType2d.Vector2): boolean;
        public RayCast(input: PhysicsType2d.Collision.RayCastInput, childIndex: number): PhysicsType2d.Collision.RayCastOutput;
        public GetMassData(): PhysicsType2d.Collision.Shapes.MassData;
        public SetDensity(density: number): void;
        public GetDensity(): number;
        public GetFriction(): number;
        public SetFriction(friction: number): void;
        public GetRestitution(): number;
        public SetRestitution(restitution: number): void;
        public GetAABB(childIndex: number): PhysicsType2d.Collision.AxisAlignedBoundingBox;
        public Dump(bodyIndex: number): void;
        static Create(body: Dynamics.Body, def: Dynamics.FixtureDefinition): Fixture;
        public Destroy(forceProxies?: boolean): void;
        public CreateProxies(broadPhase: PhysicsType2d.Collision.BroadPhase, xf: PhysicsType2d.Transform): void;
        public DestroyProxies(broadPhase: PhysicsType2d.Collision.BroadPhase): void;
        public Synchronize(broadPhase: PhysicsType2d.Collision.BroadPhase, xf1: PhysicsType2d.Transform, xf2: PhysicsType2d.Transform): void;
        public ClearBody(): void;
        public SetBody(body: Dynamics.Body): void;
        public GetProxies(): FixtureProxy[];
        public GetProxy(index: number): FixtureProxy;
        public GetProxyCount(): number;
        private m_density;
        private m_body;
        private m_shape;
        private m_friction;
        private m_restitution;
        private m_proxies;
        private m_filter;
        private m_isSensor;
        private m_userData;
    }
}
declare module PhysicsType2d.Dynamics {
    class Profile {
        public step: number;
        public collide: number;
        public solve: number;
        public solveInit: number;
        public solveVelocity: number;
        public solvePosition: number;
        public broadphase: number;
        public solveTOI: number;
    }
    class TimeStep {
        public dt: number;
        public inv_dt: number;
        public dtRatio: number;
        public velocityIterations: number;
        public positionIterations: number;
        public warmStarting: boolean;
    }
    class Position {
        constructor(c: PhysicsType2d.Vector2, a: number);
        public c: PhysicsType2d.Vector2;
        public a: number;
        public Clone(): Position;
    }
    class Velocity {
        constructor(v: PhysicsType2d.Vector2, w: number);
        public v: PhysicsType2d.Vector2;
        public w: number;
        public Clone(): Velocity;
    }
    class SolverData {
        constructor(step: TimeStep, positions: Position[], velocities: Velocity[]);
        public step: TimeStep;
        public positions: Position[];
        public velocities: Velocity[];
    }
}
declare module PhysicsType2d.Dynamics.Joints {
    enum JointType {
        UNKNOWN = 0,
        REVOLUTE = 1,
        PRISMATIC = 2,
        DISTANCE = 3,
        PULLEY = 4,
        MOUSE = 5,
        GEAR = 6,
        WHEEL = 7,
        WELD = 8,
        FRICTION = 9,
        ROPE = 10,
        MOTOR = 11,
    }
    enum LimitState {
        INACTIVE_LIMIT = 0,
        AT_LOWER_LIMIT = 1,
        AT_UPPER_LIMIT = 2,
        EQUAL_LIMIT = 3,
    }
    class Jacobian {
        public linear: PhysicsType2d.Vector2;
        public angularA: number;
        public angularB: number;
    }
    class JointDefinition {
        constructor();
        public type: JointType;
        public userData: any;
        public bodyA: Dynamics.Body;
        public bodyB: Dynamics.Body;
        public collideConnected: boolean;
    }
}
declare module PhysicsType2d.Dynamics.Joints {
    class Joint {
        constructor(def: Joints.JointDefinition);
        public GetType(): Joints.JointType;
        public GetBodyA(): Dynamics.Body;
        public GetBodyB(): Dynamics.Body;
        public GetUserData(): any;
        public SetUserData(data: any): void;
        public IsActive(): boolean;
        public GetCollideConnected(): boolean;
        public Dump(): void;
        static Create(def: Joints.JointDefinition): Joint;
        public GetAnchorA(): PhysicsType2d.Vector2;
        public GetAnchorB(): PhysicsType2d.Vector2;
        public GetReactionForce(inv_dt: number): PhysicsType2d.Vector2;
        public GetReactionTorque(inv_dt: number): number;
        public InitVelocityConstraints(data: Dynamics.SolverData): void;
        public SolveVelocityConstraints(data: Dynamics.SolverData): void;
        public SolvePositionConstraints(data: Dynamics.SolverData): boolean;
        public m_type: Joints.JointType;
        public m_edgeA: Joints.JointEdge;
        public m_edgeB: Joints.JointEdge;
        public m_bodyA: Dynamics.Body;
        public m_bodyB: Dynamics.Body;
        public m_index: number;
        public m_islandFlag: boolean;
        public m_collideConnected: boolean;
        public m_userData: any;
    }
}
declare module PhysicsType2d.Dynamics.Contacts {
    function MixFriction(friction1: number, friction2: number): number;
    function MixRestitution(restitution1: number, restitution2: number): number;
    class ContactRegister {
        public create: (fixtureA: Dynamics.Fixture, indexA: number, fixtureB: Dynamics.Fixture, indexB: number) => Contact;
        public primary: boolean;
    }
    class ContactEdge {
        public Clone(): ContactEdge;
        public other: Dynamics.Body;
        public contact: Contact;
    }
    enum ContactFlags {
        ISLAND = 1,
        TOUCHING = 2,
        ENABLED = 4,
        FILTER = 8,
        BULLET_HIT = 16,
        TOI = 32,
    }
    class Contact {
        constructor(fA: Dynamics.Fixture, indexA: number, fB: Dynamics.Fixture, indexB: number);
        public GetManifold(): PhysicsType2d.Collision.Manifold;
        public GetWorldManifold(): PhysicsType2d.Collision.WorldManifold;
        public IsTouching(): boolean;
        public SetEnabled(flag: boolean): void;
        public IsEnabled(): boolean;
        public GetFixtureA(): Dynamics.Fixture;
        public GetChildIndexA(): number;
        public GetFixtureB(): Dynamics.Fixture;
        public GetChildIndexB(): number;
        public SetFriction(friction: number): void;
        public GetFriction(): number;
        public ResetFriction(): void;
        public SetRestitution(restitution: number): void;
        public GetRestitution(): number;
        public ResetRestitution(): void;
        public FlagForFiltering(): void;
        public Evaluate(manifold: PhysicsType2d.Collision.Manifold, xfA: PhysicsType2d.Transform, xfB: PhysicsType2d.Transform): PhysicsType2d.Collision.Manifold;
        static InitializeRegisters(): void;
        static AddType(create: (fixtureA: Dynamics.Fixture, indexA: number, fixtureB: Dynamics.Fixture, indexB: number) => Contact, type1: PhysicsType2d.Collision.Shapes.ShapeType, type2: PhysicsType2d.Collision.Shapes.ShapeType): void;
        static Create(fixtureA: Dynamics.Fixture, indexA: number, fixtureB: Dynamics.Fixture, indexB: number): Contact;
        public Destructor(): void;
        public Update(listener?: Dynamics.ContactListener): void;
        private static s_registers;
        private static s_initialized;
        private m_flags;
        public SetFlag(flag: ContactFlags): void;
        public ClearFlag(flag: ContactFlags): void;
        public IsFlagSet(desiredFlags: ContactFlags): boolean;
        public m_nodeA: ContactEdge;
        public m_nodeB: ContactEdge;
        public m_fixtureA: Dynamics.Fixture;
        public m_fixtureB: Dynamics.Fixture;
        public m_manifold: PhysicsType2d.Collision.Manifold;
        public m_indexA: number;
        public m_indexB: number;
        public m_toiCount: number;
        public m_toi: number;
        public m_friction: number;
        public m_restitution: number;
    }
}
declare module PhysicsType2d.Dynamics.Contacts {
    class VelocityConstraintPoint {
        public rA: PhysicsType2d.Vector2;
        public rB: PhysicsType2d.Vector2;
        public normalImpulse: number;
        public tangentImpulse: number;
        public normalMass: number;
        public tangentMass: number;
        public velocityBias: number;
    }
    class ContactVelocityConstraint {
        public points: VelocityConstraintPoint[];
        public normal: PhysicsType2d.Vector2;
        public normalMass: PhysicsType2d.Matrix2x2;
        public K: PhysicsType2d.Matrix2x2;
        public indexA: number;
        public indexB: number;
        public invMassA: number;
        public invMassB: number;
        public invIA: number;
        public invIB: number;
        public friction: number;
        public restitution: number;
        public contactIndex: number;
    }
    class ContactSolverDef {
        public step: Dynamics.TimeStep;
        public contacts: Contacts.Contact[];
        public positions: Dynamics.Position[];
        public velocities: Dynamics.Velocity[];
    }
    class ContactPositionConstraint {
        public localPoints: PhysicsType2d.Vector2[];
        public localNormal: PhysicsType2d.Vector2;
        public localPoint: PhysicsType2d.Vector2;
        public indexA: number;
        public indexB: number;
        public invMassA: number;
        public invMassB: number;
        public localCenterA: PhysicsType2d.Vector2;
        public localCenterB: PhysicsType2d.Vector2;
        public invIA: number;
        public invIB: number;
        public type: PhysicsType2d.Collision.ManifoldType;
        public radiusA: number;
        public radiusB: number;
    }
    class ContactSolver {
        constructor(def: ContactSolverDef);
        public Destructor(): void;
        public InitializeVelocityConstraints(): void;
        public WarmStart(): void;
        public SolveVelocityConstraints(): void;
        public StoreImpulses(): void;
        public SolvePositionConstraints(): boolean;
        public SolveTOIPositionConstraints(toiIndexA: number, toiIndexB: number): boolean;
        private m_step;
        private m_contacts;
        private m_positions;
        private m_velocities;
        private m_positionConstraints;
        public m_velocityConstraints: ContactVelocityConstraint[];
    }
}
declare module PhysicsType2d.Dynamics {
    class Island {
        constructor(bodyCapacity: number, contactCapacity: number, jointCapacity: number, listener: Dynamics.ContactListener);
        private m_listener;
        private m_bodies;
        private m_bodyCapacity;
        private m_contacts;
        private m_contactCapacity;
        private m_joints;
        private m_jointCapacity;
        private m_positions;
        private m_velocities;
        public Destructor(): void;
        public GetBody(i: number): Dynamics.Body;
        public GetContact(i: number): Dynamics.Contacts.Contact;
        public GetJoint(i: number): Dynamics.Joints.Joint;
        public GetBodyCount(): number;
        public GetBodyCapacity(): number;
        public GetJointCount(): number;
        public GetJointCapacity(): number;
        private IntegrateVelocity(index, h, gravity);
        public Solve(step: Dynamics.TimeStep, gravity: PhysicsType2d.Vector2, allowSleep: boolean): Dynamics.Profile;
        private IntegratePosition(index, h);
        public SolveTOI(subStep: Dynamics.TimeStep, toiIndexA: number, toiIndexB: number): void;
        public Report(constraints: Dynamics.Contacts.ContactVelocityConstraint[]): void;
        public GetContactCount(): number;
        public GetContactCapacity(): number;
        public Clear(): void;
        public AddBody(body: Dynamics.Body): void;
        public AddContact(contact: Dynamics.Contacts.Contact): void;
        public AddJoint(joint: Dynamics.Joints.Joint): void;
    }
}
declare module PhysicsType2d.Dynamics {
    interface IDestructionListener {
        Destructor(): void;
        SayGoodbyeJoint(joint: Dynamics.Joints.Joint): void;
        SayGoodbyeFixture(fixture: Dynamics.Fixture): void;
    }
    class ContactFilter {
        public Destructor(): void;
        public ShouldCollide(fixtureA: Dynamics.Fixture, fixtureB: Dynamics.Fixture): boolean;
    }
    class ContactImpulse {
        constructor();
        public normalImpulses: number[];
        public tangentImpulses: number[];
        public Clone(): ContactImpulse;
    }
    class ContactListener {
        public Destructor(): void;
        public BeginContact(contact: Dynamics.Contacts.Contact): void;
        public EndContact(contact: Dynamics.Contacts.Contact): void;
        public PreSolve(contact: Dynamics.Contacts.Contact, oldManifold: PhysicsType2d.Collision.Manifold): void;
        public PostSolve(contact: Dynamics.Contacts.Contact, impulse: ContactImpulse): void;
    }
    interface IQueryCallback {
        Destructor(): void;
        ReportFixture(fixture: Dynamics.Fixture): boolean;
    }
    interface IRayCastCallback {
        Destructor(): void;
        ReportFixture(fixture: Dynamics.Fixture, point: PhysicsType2d.Vector2, normal: PhysicsType2d.Vector2, fraction: number): number;
    }
}
declare module PhysicsType2d.Dynamics {
    class ContactManager {
        constructor();
        public Destroy(c: Dynamics.Contacts.Contact): void;
        public Collide(): void;
        public FindNewContacts(): void;
        public AddPair(proxyUserDataA: any, proxyUserDataB: any): void;
        public GetContactList(): PhysicsType2d.IListIterator<Dynamics.Contacts.Contact>;
        public Count(): number;
        public m_broadPhase: PhysicsType2d.Collision.BroadPhase;
        private m_contactList;
        public m_contactFilter: Dynamics.ContactFilter;
        public m_contactListener: Dynamics.ContactListener;
    }
}
declare module PhysicsType2d.Dynamics {
    enum WorldFlags {
        NEW_FIXTURE = 1,
        LOCKED = 2,
        CLEAR_FORCES = 4,
    }
    class WorldQueryWrapper implements PhysicsType2d.Collision.IQueryListener {
        public QueryCallback(proxyId: number): boolean;
        public broadPhase: PhysicsType2d.Collision.BroadPhase;
        public callback: Dynamics.IQueryCallback;
        public Clone(): WorldQueryWrapper;
    }
    class WorldRayCastWrapper implements PhysicsType2d.Collision.IProxyHitCallback {
        public RayCastCallback(input: PhysicsType2d.Collision.RayCastInput, proxyId: number): number;
        public broadPhase: PhysicsType2d.Collision.BroadPhase;
        public callback: Dynamics.IRayCastCallback;
        public Clone(): WorldRayCastWrapper;
    }
    class World {
        constructor(gravity: PhysicsType2d.Vector2);
        public GetBodyList(): PhysicsType2d.IListIterator<Dynamics.Body>;
        public GetJoints(): PhysicsType2d.IListIterator<Dynamics.Joints.Joint>;
        public GetContactList(): PhysicsType2d.IListIterator<Dynamics.Contacts.Contact>;
        public GetBodyCount(): number;
        public GetJointCount(): number;
        public GetContactCount(): number;
        public SetGravity(gravity: PhysicsType2d.Vector2): void;
        public GetGravity(): PhysicsType2d.Vector2;
        public IsLocked(): boolean;
        public SetAutoClearForces(flag: boolean): void;
        public GetAutoClearForces(): boolean;
        public GetContactManager(): Dynamics.ContactManager;
        public GetProfile(): Dynamics.Profile;
        public Destructor(): void;
        public SetDestructionListener(listener: Dynamics.IDestructionListener): void;
        public SetContactFilter(filter: Dynamics.ContactFilter): void;
        public SetContactListener(listener: Dynamics.ContactListener): void;
        public SetDebugDraw(debugDraw: PhysicsType2d.IDraw): void;
        public CreateBody(def: Dynamics.BodyDefinition): Dynamics.Body;
        public DestroyBody(b: Dynamics.Body): void;
        public CreateJoint(def: Dynamics.Joints.JointDefinition): Dynamics.Joints.Joint;
        public DestroyJoint(j: Dynamics.Joints.Joint): void;
        public GetAllowSleeping(): boolean;
        public SetAllowSleeping(flag: boolean): void;
        public Solve(step: Dynamics.TimeStep): void;
        private InvalidateTOI();
        public SolveTOI(step: Dynamics.TimeStep): void;
        private ComputeTOIContact(c);
        private FindMinimum();
        private FindTOI(island, step);
        public Step(dt: number, velocityIterations: number, positionIterations: number): void;
        public ClearForces(): void;
        public QueryAABB(callback: Dynamics.IQueryCallback, aabb: PhysicsType2d.Collision.AxisAlignedBoundingBox): void;
        public RayCast(callback: Dynamics.IRayCastCallback, point1: PhysicsType2d.Vector2, point2: PhysicsType2d.Vector2): void;
        public DrawDebugData(): void;
        public SetWarmStarting(flag: boolean): void;
        public GetWarmStarting(): boolean;
        public SetContinuousPhysics(flag: boolean): void;
        public GetContinuousPhysics(): boolean;
        public SetSubStepping(flag: boolean): void;
        public GetSubStepping(): boolean;
        public GetProxyCount(): number;
        public GetTreeHeight(): number;
        public GetTreeBalance(): number;
        public GetTreeQuality(): number;
        public Dump(): void;
        private DrawJoint(joint);
        private DrawShape(fixture, xf, color);
        private m_flags;
        public SetFlag(flag: WorldFlags): void;
        public ClearFlag(flag: WorldFlags): void;
        public IsFlagSet(desiredFlags: WorldFlags): boolean;
        private m_contactManager;
        private m_bodyList;
        private m_jointList;
        private m_gravity;
        private m_allowSleep;
        private m_destructionListener;
        private m_debugDraw;
        private m_inv_dt0;
        private m_warmStarting;
        private m_continuousPhysics;
        private m_subStepping;
        private m_stepComplete;
        private m_profile;
    }
}
declare module PhysicsType2d.Dynamics.Joints {
    class JointEdge {
        public other: Dynamics.Body;
        public joint: Joints.Joint;
    }
}
declare module PhysicsType2d.Dynamics {
    class Body {
        constructor();
        public CreateFixtureFromDefinition(def: Dynamics.FixtureDefinition): Dynamics.Fixture;
        public CreateFixture(shape: PhysicsType2d.Collision.Shapes.IShape, density: number): Dynamics.Fixture;
        public DestroyFixture(fixture: Dynamics.Fixture): void;
        private DestroyAssociatedContacts(fixture);
        public SetTransform(position: PhysicsType2d.Vector2, angle: number): void;
        public GetTransform(): PhysicsType2d.Transform;
        public GetPosition(): PhysicsType2d.Vector2;
        public GetAngle(): number;
        public GetWorldCenter(): PhysicsType2d.Vector2;
        public GetLocalCenter(): PhysicsType2d.Vector2;
        public SetLinearVelocity(v: PhysicsType2d.Vector2): void;
        public GetLinearVelocity(): PhysicsType2d.Vector2;
        public SetAngularVelocity(omega: number): void;
        public GetAngularVelocity(): number;
        public ApplyForce(force: PhysicsType2d.Vector2, point: PhysicsType2d.Vector2): void;
        public ApplyForceToCenter(force: PhysicsType2d.Vector2): void;
        public ApplyTorque(torque: number): void;
        public ApplyLinearImpulse(impulse: PhysicsType2d.Vector2, point: PhysicsType2d.Vector2): void;
        public ApplyAngularImpulse(impulse: number): void;
        public GetMass(): number;
        public GetInertia(): number;
        public GetMassData(): PhysicsType2d.Collision.Shapes.MassData;
        public SetMassData(data: PhysicsType2d.Collision.Shapes.MassData): void;
        public ResetMassData(): void;
        public GetWorldPoint(localPoint: PhysicsType2d.Vector2): PhysicsType2d.Vector2;
        public GetWorldVector(localVector: PhysicsType2d.Vector2): PhysicsType2d.Vector2;
        public GetLocalPoint(worldPoint: PhysicsType2d.Vector2): PhysicsType2d.Vector2;
        public GetLocalVector(worldVector: PhysicsType2d.Vector2): PhysicsType2d.Vector2;
        public GetLinearVelocityFromWorldPoint(worldPoint: PhysicsType2d.Vector2): PhysicsType2d.Vector2;
        public GetLinearVelocityFromLocalPoint(localPoint: PhysicsType2d.Vector2): PhysicsType2d.Vector2;
        public GetLinearDamping(): number;
        public SetLinearDamping(linearDamping: number): void;
        public GetAngularDamping(): number;
        public SetAngularDamping(angularDamping: number): void;
        public GetGravityScale(): number;
        public SetGravityScale(scale: number): void;
        public SetType(type: Dynamics.BodyType): void;
        public GetType(): Dynamics.BodyType;
        public SetSleepingAllowed(flag: boolean): void;
        public IsSleepingAllowed(): boolean;
        public SetBullet(flag: boolean): void;
        public IsBullet(): boolean;
        public SetAwake(flag: boolean): void;
        public IsAwake(): boolean;
        public SetActive(flag: boolean): void;
        public GetIslandIndex(): number;
        public SetIslandIndex(value: number): void;
        public GetSweep(): PhysicsType2d.Sweep;
        public SetSweep(value: PhysicsType2d.Sweep): void;
        public GetSleepTime(): number;
        public SetSleepTime(value: number): void;
        public GetInvMass(): number;
        public GetInvI(): number;
        public IsActive(): boolean;
        public SetFixedRotation(flag: boolean): void;
        public IsFixedRotation(): boolean;
        public GetFixtures(): PhysicsType2d.IListIterator<Dynamics.Fixture>;
        public ClearFixtures(): void;
        public GetJointEdges(): PhysicsType2d.IListIterator<Dynamics.Joints.JointEdge>;
        public ClearJointEdges(): void;
        public AddJointEdge(edge: Dynamics.Joints.JointEdge): void;
        public RemoveJointEdge(edge: Dynamics.Joints.JointEdge): boolean;
        public GetContactEdges(): PhysicsType2d.IListIterator<Dynamics.Contacts.ContactEdge>;
        public ClearContactEdges(): void;
        public RemoveContactEdge(edge: Dynamics.Contacts.ContactEdge): boolean;
        public AddContactEdge(edge: Dynamics.Contacts.ContactEdge): void;
        public SetUserData(data: any): void;
        public GetUserData(): any;
        public GetWorld(): Dynamics.World;
        public Dump(): void;
        public GetForce(): PhysicsType2d.Vector2;
        public SetForce(value: PhysicsType2d.Vector2): void;
        public GetTorque(): number;
        public SetTorque(value: number): void;
        static FromDefinition(def: Dynamics.BodyDefinition, world: Dynamics.World): Body;
        public SynchronizeFixtures(): void;
        public SynchronizeTransform(): void;
        public ShouldCollide(other: Body): boolean;
        public Advance(alpha: number): void;
        private m_type;
        private m_flags;
        public SetFlag(flag: Dynamics.BodyFlags): void;
        public ClearFlag(flag: Dynamics.BodyFlags): void;
        public IsFlagSet(desiredFlags: Dynamics.BodyFlags): boolean;
        private m_islandIndex;
        private m_xf;
        public m_sweep: PhysicsType2d.Sweep;
        private m_linearVelocity;
        private m_angularVelocity;
        private m_force;
        private m_torque;
        private m_world;
        private m_fixtureList;
        private m_jointEdgeList;
        private m_contactEdgeList;
        private m_mass;
        private m_invMass;
        private m_I;
        private m_invI;
        private m_linearDamping;
        private m_angularDamping;
        private m_gravityScale;
        private m_sleepTime;
        private m_userData;
    }
}
declare module PhysicsType2d.Dynamics.Contacts {
    class ChainAndCircleContact extends Contacts.Contact {
        constructor(fixtureA: Dynamics.Fixture, indexA: number, fixtureB: Dynamics.Fixture, indexB: number);
        static Create(fixtureA: Dynamics.Fixture, indexA: number, fixtureB: Dynamics.Fixture, indexB: number): Contacts.Contact;
        public Evaluate(manifold: PhysicsType2d.Collision.Manifold, xfA: PhysicsType2d.Transform, xfB: PhysicsType2d.Transform): PhysicsType2d.Collision.Manifold;
    }
}
declare module PhysicsType2d.Dynamics.Contacts {
    class ChainAndPolygonContact extends Contacts.Contact {
        constructor(fixtureA: Dynamics.Fixture, indexA: number, fixtureB: Dynamics.Fixture, indexB: number);
        static Create(fixtureA: Dynamics.Fixture, indexA: number, fixtureB: Dynamics.Fixture, indexB: number): Contacts.Contact;
        public Evaluate(manifold: PhysicsType2d.Collision.Manifold, xfA: PhysicsType2d.Transform, xfB: PhysicsType2d.Transform): PhysicsType2d.Collision.Manifold;
    }
}
declare module PhysicsType2d.Dynamics.Contacts {
    class CircleContact extends Contacts.Contact {
        constructor(fixtureA: Dynamics.Fixture, indexA: number, fixtureB: Dynamics.Fixture, indexB: number);
        static Create(fixtureA: Dynamics.Fixture, indexA: number, fixtureB: Dynamics.Fixture, indexB: number): Contacts.Contact;
        public Evaluate(manifold: PhysicsType2d.Collision.Manifold, xfA: PhysicsType2d.Transform, xfB: PhysicsType2d.Transform): PhysicsType2d.Collision.Manifold;
    }
}
declare module PhysicsType2d.Dynamics.Contacts {
    class EdgeAndCircleContact extends Contacts.Contact {
        constructor(fixtureA: Dynamics.Fixture, indexA: number, fixtureB: Dynamics.Fixture, indexB: number);
        static Create(fixtureA: Dynamics.Fixture, indexA: number, fixtureB: Dynamics.Fixture, indexB: number): Contacts.Contact;
        public Evaluate(manifold: PhysicsType2d.Collision.Manifold, xfA: PhysicsType2d.Transform, xfB: PhysicsType2d.Transform): PhysicsType2d.Collision.Manifold;
    }
}
declare module PhysicsType2d.Dynamics.Contacts {
    class EdgeAndPolygonContact extends Contacts.Contact {
        constructor(fixtureA: Dynamics.Fixture, indexA: number, fixtureB: Dynamics.Fixture, indexB: number);
        static Create(fixtureA: Dynamics.Fixture, indexA: number, fixtureB: Dynamics.Fixture, indexB: number): Contacts.Contact;
        public Evaluate(manifold: PhysicsType2d.Collision.Manifold, xfA: PhysicsType2d.Transform, xfB: PhysicsType2d.Transform): PhysicsType2d.Collision.Manifold;
    }
}
declare module PhysicsType2d.Dynamics.Contacts {
    class PolygonAndCircleContact extends Contacts.Contact {
        constructor(fixtureA: Dynamics.Fixture, indexA: number, fixtureB: Dynamics.Fixture, indexB: number);
        static Create(fixtureA: Dynamics.Fixture, indexA: number, fixtureB: Dynamics.Fixture, indexB: number): Contacts.Contact;
        public Evaluate(manifold: PhysicsType2d.Collision.Manifold, xfA: PhysicsType2d.Transform, xfB: PhysicsType2d.Transform): PhysicsType2d.Collision.Manifold;
    }
}
declare module PhysicsType2d.Dynamics.Contacts {
    class PolygonContact extends Contacts.Contact {
        constructor(fixtureA: Dynamics.Fixture, indexA: number, fixtureB: Dynamics.Fixture, indexB: number);
        static Create(fixtureA: Dynamics.Fixture, indexA: number, fixtureB: Dynamics.Fixture, indexB: number): Contacts.Contact;
        public Evaluate(manifold: PhysicsType2d.Collision.Manifold, xfA: PhysicsType2d.Transform, xfB: PhysicsType2d.Transform): PhysicsType2d.Collision.Manifold;
    }
}
declare module PhysicsType2d.Dynamics.Joints {
    class DistanceJointDefinition extends Joints.JointDefinition {
        constructor();
        public Initialize(bA: Dynamics.Body, bB: Dynamics.Body, anchorA: PhysicsType2d.Vector2, anchorB: PhysicsType2d.Vector2): void;
        public localAnchorA: PhysicsType2d.Vector2;
        public localAnchorB: PhysicsType2d.Vector2;
        public length: number;
        public frequencyHz: number;
        public dampingRatio: number;
    }
    class DistanceJoint extends Joints.Joint {
        constructor(def: DistanceJointDefinition);
        public GetAnchorA(): PhysicsType2d.Vector2;
        public GetAnchorB(): PhysicsType2d.Vector2;
        public GetReactionForce(inv_dt: number): PhysicsType2d.Vector2;
        public GetReactionTorque(inv_dt: number): number;
        public GetLocalAnchorA(): PhysicsType2d.Vector2;
        public GetLocalAnchorB(): PhysicsType2d.Vector2;
        public SetLength(length: number): void;
        public GetLength(): number;
        public SetFrequency(hz: number): void;
        public GetFrequency(): number;
        public SetDampingRatio(ratio: number): void;
        public GetDampingRatio(): number;
        public Dump(): void;
        public InitVelocityConstraints(data: Dynamics.SolverData): void;
        public SolveVelocityConstraints(data: Dynamics.SolverData): void;
        public SolvePositionConstraints(data: Dynamics.SolverData): boolean;
        private m_frequencyHz;
        private m_dampingRatio;
        private m_bias;
        private m_gamma;
        private m_length;
        private m_localAnchorA;
        private m_localAnchorB;
        private m_impulse;
        private m_indexA;
        private m_indexB;
        private m_u;
        private m_rA;
        private m_rB;
        private m_localCenterA;
        private m_localCenterB;
        private m_invMassA;
        private m_invMassB;
        private m_invIA;
        private m_invIB;
        private m_mass;
    }
}
declare module PhysicsType2d.Dynamics.Joints {
    class FrictionJointDefinition extends Joints.JointDefinition {
        constructor();
        public Initialize(bA: Dynamics.Body, bB: Dynamics.Body, anchor: PhysicsType2d.Vector2): void;
        public localAnchorA: PhysicsType2d.Vector2;
        public localAnchorB: PhysicsType2d.Vector2;
        public maxForce: number;
        public maxTorque: number;
    }
    class FrictionJoint extends Joints.Joint {
        constructor(def: FrictionJointDefinition);
        public InitVelocityConstraints(data: Dynamics.SolverData): void;
        private SolveAngularFriction(velocityA, velocityB, h);
        private SolveLinearFriction(velocityA, velocityB, h);
        public SolveVelocityConstraints(data: Dynamics.SolverData): void;
        public SolvePositionConstraints(data: Dynamics.SolverData): boolean;
        public GetLocalAnchorA(): PhysicsType2d.Vector2;
        public GetLocalAnchorB(): PhysicsType2d.Vector2;
        public GetAnchorA(): PhysicsType2d.Vector2;
        public GetAnchorB(): PhysicsType2d.Vector2;
        public GetReactionForce(inv_dt: number): PhysicsType2d.Vector2;
        public GetReactionTorque(inv_dt: number): number;
        public SetMaxForce(force: number): void;
        public GetMaxForce(): number;
        public SetMaxTorque(torque: number): void;
        public GetMaxTorque(): number;
        public Dump(): void;
        private m_linearImpulse;
        private m_angularImpulse;
        private m_maxForce;
        private m_maxTorque;
        private m_localAnchorA;
        private m_localAnchorB;
        private m_indexA;
        private m_indexB;
        private m_u;
        private m_rA;
        private m_rB;
        private m_localCenterA;
        private m_localCenterB;
        private m_invMassA;
        private m_invMassB;
        private m_invIA;
        private m_invIB;
        private m_linearMass;
        private m_angularMass;
    }
}
declare module PhysicsType2d.Dynamics.Joints {
    class RevoluteJointDefinition extends Joints.JointDefinition {
        constructor();
        public Initialize(bA: Dynamics.Body, bB: Dynamics.Body, anchor: PhysicsType2d.Vector2): void;
        public localAnchorA: PhysicsType2d.Vector2;
        public localAnchorB: PhysicsType2d.Vector2;
        public referenceAngle: number;
        public enableLimit: boolean;
        public lowerAngle: number;
        public upperAngle: number;
        public enableMotor: boolean;
        public motorSpeed: number;
        public maxMotorTorque: number;
    }
    class RevoluteJoint extends Joints.Joint {
        constructor(def: RevoluteJointDefinition);
        public GetAnchorA(): PhysicsType2d.Vector2;
        public GetAnchorB(): PhysicsType2d.Vector2;
        public GetReactionForce(inv_dt: number): PhysicsType2d.Vector2;
        public GetReactionTorque(inv_dt: number): number;
        public GetJointAngle(): number;
        public GetJointSpeed(): number;
        public IsMotorEnabled(): boolean;
        public EnableMotor(flag: boolean): void;
        public GetMotorTorque(inv_dt: number): number;
        public SetMotorSpeed(speed: number): void;
        public SetMaxMotorTorque(torque: number): void;
        public IsLimitEnabled(): boolean;
        public EnableLimit(flag: boolean): void;
        public GetLowerLimit(): number;
        public GetUpperLimit(): number;
        public SetLimits(lower: number, upper: number): void;
        public Dump(): void;
        public GetLocalAnchorA(): PhysicsType2d.Vector2;
        public GetLocalAnchorB(): PhysicsType2d.Vector2;
        public GetReferenceAngle(): number;
        public GetMaxMotorTorque(): number;
        public GetMotorSpeed(): number;
        public InitVelocityConstraints(data: Dynamics.SolverData): void;
        public SolveVelocityConstraints(data: Dynamics.SolverData): void;
        public SolvePositionConstraints(data: Dynamics.SolverData): boolean;
        private m_impulse;
        private m_motorImpulse;
        private m_enableMotor;
        private m_maxMotorTorque;
        private m_motorSpeed;
        private m_enableLimit;
        private m_referenceAngle;
        private m_lowerAngle;
        private m_upperAngle;
        private m_localAnchorA;
        private m_localAnchorB;
        private m_indexA;
        private m_indexB;
        private m_rA;
        private m_rB;
        private m_localCenterA;
        private m_localCenterB;
        private m_invMassA;
        private m_invMassB;
        private m_invIA;
        private m_invIB;
        private m_mass;
        private m_motorMass;
        private m_limitState;
    }
}
declare module PhysicsType2d.Dynamics.Joints {
    class PrismaticJointDefinition extends Joints.JointDefinition {
        constructor();
        public Initialize(bA: Dynamics.Body, bB: Dynamics.Body, anchor: PhysicsType2d.Vector2, axis: PhysicsType2d.Vector2): void;
        public localAnchorA: PhysicsType2d.Vector2;
        public localAnchorB: PhysicsType2d.Vector2;
        public localAxisA: PhysicsType2d.Vector2;
        public referenceAngle: number;
        public enableLimit: boolean;
        public lowerTranslation: number;
        public upperTranslation: number;
        public enableMotor: boolean;
        public maxMotorForce: number;
        public motorSpeed: number;
    }
    class PrismaticJoint extends Joints.Joint {
        constructor(def: PrismaticJointDefinition);
        public GetLocalAnchorA(): PhysicsType2d.Vector2;
        public GetLocalAnchorB(): PhysicsType2d.Vector2;
        public GetLocalAxisA(): PhysicsType2d.Vector2;
        public GetReferenceAngle(): number;
        public GetMotorSpeed(): number;
        public GetAnchorA(): PhysicsType2d.Vector2;
        public GetAnchorB(): PhysicsType2d.Vector2;
        public GetReactionForce(inv_dt: number): PhysicsType2d.Vector2;
        public GetReactionTorque(inv_dt: number): number;
        public GetJointTranslation(): number;
        public GetJointSpeed(): number;
        public IsLimitEnabled(): boolean;
        public EnableLimit(flag: boolean): void;
        public GetLowerLimit(): number;
        public GetUpperLimit(): number;
        public SetLimits(lower: number, upper: number): void;
        public IsMotorEnabled(): boolean;
        public EnableMotor(flag: boolean): void;
        public SetMotorSpeed(speed: number): void;
        public SetMaxMotorForce(force: number): void;
        public GetMotorForce(inv_dt: number): number;
        public Dump(): void;
        public InitVelocityConstraints(data: Dynamics.SolverData): void;
        public SolveVelocityConstraints(data: Dynamics.SolverData): void;
        public SolvePositionConstraints(data: Dynamics.SolverData): boolean;
        private m_localXAxisA;
        private m_localYAxisA;
        private m_referenceAngle;
        private m_impulse;
        private m_motorImpulse;
        private m_lowerTranslation;
        private m_upperTranslation;
        private m_maxMotorForce;
        private m_motorSpeed;
        private m_enableLimit;
        private m_enableMotor;
        private m_limitState;
        private m_localAnchorA;
        private m_localAnchorB;
        private m_indexA;
        private m_indexB;
        private m_localCenterA;
        private m_localCenterB;
        private m_invMassA;
        private m_invMassB;
        private m_invIA;
        private m_invIB;
        private m_axis;
        private m_perp;
        private m_s1;
        private m_s2;
        private m_a1;
        private m_a2;
        private m_K;
        private m_motorMass;
    }
}
declare module PhysicsType2d.Dynamics.Joints {
    class GearJointDefinition extends Joints.JointDefinition {
        constructor();
        public joint1: Joints.Joint;
        public joint2: Joints.Joint;
        public ratio: number;
    }
    class GearJoint extends Joints.Joint {
        constructor(def: GearJointDefinition);
        public InitVelocityConstraints(data: Dynamics.SolverData): void;
        public SolveVelocityConstraints(data: Dynamics.SolverData): void;
        public SolvePositionConstraints(data: Dynamics.SolverData): boolean;
        public GetAnchorA(): PhysicsType2d.Vector2;
        public GetAnchorB(): PhysicsType2d.Vector2;
        public GetReactionForce(inv_dt: number): PhysicsType2d.Vector2;
        public GetReactionTorque(inv_dt: number): number;
        public SetRatio(ratio: number): void;
        public GetRatio(): number;
        public Dump(): void;
        public GetJoint1(): Joints.Joint;
        public GetJoint2(): Joints.Joint;
        private m_joint1;
        private m_joint2;
        private m_typeA;
        private m_typeB;
        private m_bodyC;
        private m_bodyD;
        private m_localAnchorC;
        private m_localAnchorD;
        private m_localAxisC;
        private m_localAxisD;
        private m_referenceAngleA;
        private m_referenceAngleB;
        private m_constant;
        private m_ratio;
        private m_localAnchorA;
        private m_localAnchorB;
        private m_impulse;
        private m_indexA;
        private m_indexB;
        private m_mass;
        private m_indexC;
        private m_indexD;
        private m_lcA;
        private m_lcB;
        private m_lcC;
        private m_lcD;
        private m_mA;
        private m_mB;
        private m_mC;
        private m_mD;
        private m_iA;
        private m_iB;
        private m_iC;
        private m_iD;
        private m_JvAC;
        private m_JvBD;
        private m_JwA;
        private m_JwB;
        private m_JwC;
        private m_JwD;
    }
}
declare module PhysicsType2d.Dynamics.Joints {
    class MouseJointDefinition extends Joints.JointDefinition {
        constructor();
        public target: PhysicsType2d.Vector2;
        public maxForce: number;
        public frequencyHz: number;
        public dampingRatio: number;
    }
    class MouseJoint extends Joints.Joint {
        constructor(def: MouseJointDefinition);
        public SetTarget(target: PhysicsType2d.Vector2): void;
        public GetTarget(): PhysicsType2d.Vector2;
        public SetMaxForce(force: number): void;
        public GetMaxForce(): number;
        public SetFrequency(hz: number): void;
        public GetFrequency(): number;
        public SetDampingRatio(ratio: number): void;
        public GetDampingRatio(): number;
        public GetAnchorA(): PhysicsType2d.Vector2;
        public GetAnchorB(): PhysicsType2d.Vector2;
        public GetReactionForce(inv_dt: number): PhysicsType2d.Vector2;
        public GetReactionTorque(inv_dt: number): number;
        public InitVelocityConstraints(data: Dynamics.SolverData): void;
        public SolveVelocityConstraints(data: Dynamics.SolverData): void;
        public SolvePositionConstraints(data: Dynamics.SolverData): boolean;
        private m_localAnchorB;
        private m_targetA;
        private m_frequencyHz;
        private m_dampingRatio;
        private m_beta;
        private m_impulse;
        private m_gamma;
        private m_maxForce;
        private m_indexA;
        private m_indexB;
        private m_rB;
        private m_localCenterB;
        private m_invMassB;
        private m_invIB;
        private m_mass;
        private m_C;
    }
}
declare module PhysicsType2d.Dynamics.Joints {
    class MotorJointDefinition extends Joints.JointDefinition {
        constructor();
        public Initialize(bA: Dynamics.Body, bB: Dynamics.Body): void;
        public linearOffset: PhysicsType2d.Vector2;
        public angularOffset: number;
        public maxForce: number;
        public maxTorque: number;
        public correctionFactor: number;
    }
    class MotorJoint extends Joints.Joint {
        constructor(def: MotorJointDefinition);
        public SetMaxForce(force: number): void;
        public GetMaxForce(): number;
        public GetAnchorA(): PhysicsType2d.Vector2;
        public GetAnchorB(): PhysicsType2d.Vector2;
        public GetReactionForce(inv_dt: number): PhysicsType2d.Vector2;
        public GetReactionTorque(inv_dt: number): number;
        public InitVelocityConstraints(data: Dynamics.SolverData): void;
        private SolveAngularFriction(velocityA, velocityB, h, inv_h);
        private SolveLinearFriction(velocityA, velocityB, h, inv_h);
        public SolveVelocityConstraints(data: Dynamics.SolverData): void;
        public SolvePositionConstraints(data: Dynamics.SolverData): boolean;
        public Dump(): void;
        public SetLinearOffset(linearOffset: PhysicsType2d.Vector2): void;
        public GetLinearOffset(): PhysicsType2d.Vector2;
        public SetAngularOffset(angularOffset: number): void;
        public GetAngularOffset(): number;
        public SetMaxTorque(torque: number): void;
        public GetMaxTorque(): number;
        public SetCorrectionFactor(factor: number): void;
        public GetCorrectionFactor(): number;
        private m_linearOffset;
        private m_angularOffset;
        private m_correctionFactor;
        private m_linearImpulse;
        private m_angularImpulse;
        private m_maxForce;
        private m_maxTorque;
        private m_indexA;
        private m_indexB;
        private m_rA;
        private m_rB;
        private m_localCenterA;
        private m_localCenterB;
        private m_invMassA;
        private m_invMassB;
        private m_invIA;
        private m_invIB;
        private m_linearError;
        private m_angularError;
        private m_linearMass;
        private m_angularMass;
    }
}
declare module PhysicsType2d.Dynamics.Joints {
    class PulleyJointDefinition extends Joints.JointDefinition {
        constructor();
        public Initialize(bA: Dynamics.Body, bB: Dynamics.Body, groundA: PhysicsType2d.Vector2, groundB: PhysicsType2d.Vector2, anchorA: PhysicsType2d.Vector2, anchorB: PhysicsType2d.Vector2, r: number): void;
        public groundAnchorA: PhysicsType2d.Vector2;
        public groundAnchorB: PhysicsType2d.Vector2;
        public localAnchorA: PhysicsType2d.Vector2;
        public localAnchorB: PhysicsType2d.Vector2;
        public lengthA: number;
        public lengthB: number;
        public ratio: number;
    }
    class PulleyJoint extends Joints.Joint {
        constructor(def: PulleyJointDefinition);
        public GetAnchorA(): PhysicsType2d.Vector2;
        public GetAnchorB(): PhysicsType2d.Vector2;
        public GetReactionForce(inv_dt: number): PhysicsType2d.Vector2;
        public GetReactionTorque(inv_dt: number): number;
        public GetGroundAnchorA(): PhysicsType2d.Vector2;
        public GetGroundAnchorB(): PhysicsType2d.Vector2;
        public GetLengthA(): number;
        public GetLengthB(): number;
        public GetRatio(): number;
        public Dump(): void;
        public InitVelocityConstraints(data: Dynamics.SolverData): void;
        public SolveVelocityConstraints(data: Dynamics.SolverData): void;
        public SolvePositionConstraints(data: Dynamics.SolverData): boolean;
        private m_groundAnchorA;
        private m_groundAnchorB;
        private m_lengthA;
        private m_lengthB;
        private m_constant;
        private m_ratio;
        private m_impulse;
        private m_localAnchorA;
        private m_localAnchorB;
        private m_indexA;
        private m_indexB;
        private m_rA;
        private m_rB;
        private m_localCenterA;
        private m_localCenterB;
        private m_invMassA;
        private m_invMassB;
        private m_invIA;
        private m_invIB;
        private m_mass;
        private m_uA;
        private m_uB;
    }
}
declare module PhysicsType2d.Dynamics.Joints {
    class RopeJointDefinition extends Joints.JointDefinition {
        constructor();
        public localAnchorA: PhysicsType2d.Vector2;
        public localAnchorB: PhysicsType2d.Vector2;
        public maxLength: number;
    }
    class RopeJoint extends Joints.Joint {
        constructor(def: RopeJointDefinition);
        public GetAnchorA(): PhysicsType2d.Vector2;
        public GetAnchorB(): PhysicsType2d.Vector2;
        public GetReactionForce(inv_dt: number): PhysicsType2d.Vector2;
        public GetReactionTorque(inv_dt: number): number;
        public GetMaxLength(): number;
        public GetLimitState(): Joints.LimitState;
        public Dump(): void;
        public GetLocalAnchorA(): PhysicsType2d.Vector2;
        public GetLocalAnchorB(): PhysicsType2d.Vector2;
        public SetMaxLength(length: number): void;
        public InitVelocityConstraints(data: Dynamics.SolverData): void;
        public SolveVelocityConstraints(data: Dynamics.SolverData): void;
        public SolvePositionConstraints(data: Dynamics.SolverData): boolean;
        private m_maxLength;
        private m_length;
        private m_impulse;
        private m_localAnchorA;
        private m_localAnchorB;
        private m_indexA;
        private m_indexB;
        private m_u;
        private m_rA;
        private m_rB;
        private m_localCenterA;
        private m_localCenterB;
        private m_invMassA;
        private m_invMassB;
        private m_invIA;
        private m_invIB;
        private m_mass;
        private m_state;
    }
}
declare module PhysicsType2d.Dynamics.Joints {
    class WeldJointDefinition extends Joints.JointDefinition {
        constructor();
        public Initialize(bA: Dynamics.Body, bB: Dynamics.Body, anchor: PhysicsType2d.Vector2): void;
        public localAnchorA: PhysicsType2d.Vector2;
        public localAnchorB: PhysicsType2d.Vector2;
        public referenceAngle: number;
        public frequencyHz: number;
        public dampingRatio: number;
    }
    class WeldJoint extends Joints.Joint {
        constructor(def: WeldJointDefinition);
        public GetLocalAnchorA(): PhysicsType2d.Vector2;
        public GetLocalAnchorB(): PhysicsType2d.Vector2;
        public GetReferenceAngle(): number;
        public SetFrequency(hz: number): void;
        public GetFrequency(): number;
        public SetDampingRatio(ratio: number): void;
        public GetDampingRatio(): number;
        public GetAnchorA(): PhysicsType2d.Vector2;
        public GetAnchorB(): PhysicsType2d.Vector2;
        public GetReactionForce(inv_dt: number): PhysicsType2d.Vector2;
        public GetReactionTorque(inv_dt: number): number;
        public Dump(): void;
        public InitVelocityConstraints(data: Dynamics.SolverData): void;
        public SolveVelocityConstraints(data: Dynamics.SolverData): void;
        public SolvePositionConstraints(data: Dynamics.SolverData): boolean;
        private m_frequencyHz;
        private m_dampingRatio;
        private m_bias;
        private m_referenceAngle;
        private m_gamma;
        private m_impulse;
        private m_localAnchorA;
        private m_localAnchorB;
        private m_indexA;
        private m_indexB;
        private m_rA;
        private m_rB;
        private m_localCenterA;
        private m_localCenterB;
        private m_invMassA;
        private m_invMassB;
        private m_invIA;
        private m_invIB;
        private m_mass;
    }
}
declare module PhysicsType2d.Dynamics.Joints {
    class WheelJointDefinition extends Joints.JointDefinition {
        constructor();
        public Initialize(bA: Dynamics.Body, bB: Dynamics.Body, anchor: PhysicsType2d.Vector2, axis: PhysicsType2d.Vector2): void;
        public localAnchorA: PhysicsType2d.Vector2;
        public localAnchorB: PhysicsType2d.Vector2;
        public localAxisA: PhysicsType2d.Vector2;
        public enableMotor: boolean;
        public maxMotorTorque: number;
        public motorSpeed: number;
        public frequencyHz: number;
        public dampingRatio: number;
    }
}
declare module PhysicsType2d.Dynamics.Joints {
    class WheelJoint extends Joints.Joint {
        constructor(def: Joints.WheelJointDefinition);
        public GetAnchorA(): PhysicsType2d.Vector2;
        public GetAnchorB(): PhysicsType2d.Vector2;
        public GetReactionForce(inv_dt: number): PhysicsType2d.Vector2;
        public GetReactionTorque(inv_dt: number): number;
        public GetLocalAnchorA(): PhysicsType2d.Vector2;
        public GetLocalAnchorB(): PhysicsType2d.Vector2;
        public GetLocalAxisA(): PhysicsType2d.Vector2;
        public GetJointTranslation(): number;
        public GetJointSpeed(): number;
        public IsMotorEnabled(): boolean;
        public EnableMotor(flag: boolean): void;
        public SetMotorSpeed(speed: number): void;
        public GetMotorSpeed(): number;
        public SetMaxMotorTorque(torque: number): void;
        public GetMaxMotorTorque(): number;
        public GetMotorTorque(inv_dt: number): number;
        public SetSpringFrequencyHz(hz: number): void;
        public GetSpringFrequencyHz(): number;
        public SetSpringDampingRatio(ratio: number): void;
        public GetSpringDampingRatio(): number;
        public Dump(): void;
        public InitVelocityConstraints(data: Dynamics.SolverData): void;
        public SolveVelocityConstraints(data: Dynamics.SolverData): void;
        public SolvePositionConstraints(data: Dynamics.SolverData): boolean;
        private m_frequencyHz;
        private m_dampingRatio;
        private m_localAnchorA;
        private m_localAnchorB;
        private m_localXAxisA;
        private m_localYAxisA;
        private m_impulse;
        private m_motorImpulse;
        private m_springImpulse;
        private m_maxMotorTorque;
        private m_motorSpeed;
        private m_enableMotor;
        private m_indexA;
        private m_indexB;
        private m_localCenterA;
        private m_localCenterB;
        private m_invMassA;
        private m_invMassB;
        private m_invIA;
        private m_invIB;
        private m_mass;
        private m_ax;
        private m_ay;
        private m_sAx;
        private m_sBx;
        private m_sAy;
        private m_sBy;
        private m_motorMass;
        private m_springMass;
        private m_bias;
        private m_gamma;
    }
}
