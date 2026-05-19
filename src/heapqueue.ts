// HeapQueue data structure for A* algorithm
export class HeapQueue<T> {
    private heap: {item: T, priority: number}[] = [];

    push(item: T, priority: number) {
        this.heap.push({item, priority});
        this.bubbleUp(this.heap.length - 1);
    }

    pop(): T | undefined {
        if (this.isEmpty()) return undefined;
        const top = this.heap[0].item;
        const last = this.heap.pop()!;

        if (!this.isEmpty()) {
            this.heap[0] = last;
            this.bubbleDown(0);
        }

        return top;
    }

    isEmpty(): boolean {
        return this.heap.length === 0;
    }

    private bubbleUp(index: number) {
        while (index > 0) {
            const parent = (index - 1) >> 1;

            if (this.heap[index].priority >= this.heap[parent].priority) break;

            [this.heap[parent], this.heap[index]] = [this.heap[index], this.heap[parent]];

            index = parent;
        }
    }

    private bubbleDown(index: number) {
        const length = this.heap.length;

        while (true) {
            let left = index * 2 + 1
            let right = left + 1;
            let smallest = index;

            if (left < length && this.heap[left].priority < this.heap[smallest].priority) {
                smallest = left;
            }

            if (right < length && this.heap[right].priority < this.heap[smallest].priority) {
                smallest = right;
            }

            if (smallest === index) break;

            [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];

            index = smallest
        }
    }

}