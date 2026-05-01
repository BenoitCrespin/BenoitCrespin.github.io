class MetricTree {

	constructor(nbParticles, tabParticles) {
		this.tab = [];
		for (let i = 0; i < nbParticles * 4; i++)
			this.tab[i] = -1;
		this.tabParticles = tabParticles;
		this.nextAvailable = 0;
	}

	insertInTab(newId, radius) {
		let p = this.tabParticles[newId];
		// console.log(p.x + " " + p.y + " to be inserted at pos " + this.nextAvailable);
		this.tab[this.nextAvailable] = newId;
		this.tab[this.nextAvailable+1] = radius;
		this.nextAvailable += 4;
	}

	insert(newId, radius) {
		if (this.tab[0] == -1) {
			this.insertInTab(newId, radius);
			return;
		}
		let p = this.tabParticles[newId];
		let i = 0;
		while (true) {
			// console.log(this.tab[i]);
			let pp = this.tabParticles[this.tab[i]];
			let r = this.tab[i + 1];
			let d = dist(p.pos.x, p.pos.y, pp.pos.x, pp.pos.y);
			if (d < r) {
				if (this.tab[i + 2] == -1) {
					this.tab[i + 2] = this.nextAvailable;
					this.insertInTab(newId, r / 2);
					return;
				} else i = this.tab[i + 2];
			} else {
				if (this.tab[i + 3] == -1) {
					this.tab[i + 3] = this.nextAvailable;
					this.insertInTab(newId, r);
					return;
				} else i = this.tab[i + 3];
			}
		}
	}

    findNearest(p) {
        let nearest = null;
        let minDist = Infinity;
        if (this.tab[0] == -1) return null;
        let stack = [0];
        while (stack.length > 0) {
            let i = stack.pop();
            let pp = this.tabParticles[this.tab[i]];
            let r = this.tab[i + 1];
            let d = dist(p.pos.x, p.pos.y, pp.pos.x, pp.pos.y);
            if (d > 0 && d < minDist) {
                minDist = d;
                nearest = pp;
            }
            if (d < r) {
                if (this.tab[i + 2] != -1) 
                    stack.push(this.tab[i + 2]);
                if (this.tab[i + 3] != -1 && d + minDist > r) {
                    stack.push(this.tab[i + 3]);
                }
            }
            else {
                if (this.tab[i + 3] != -1) 
                    stack.push(this.tab[i + 3]);
                if (this.tab[i + 2] != -1 && d < minDist + r) {
                    stack.push(this.tab[i + 2]);
                }
            }
        }
        return nearest;
    }

	findKNearest(p, k) {
		let nearest = Array(k).fill(null);
		let minDist = Array(k).fill(Infinity);
		if (this.tab[0] == -1) return nearest;
		let stack = [0];
		while (stack.length > 0) {
			let i = stack.pop();
			let pp = this.tabParticles[this.tab[i]];
			let r = this.tab[i + 1];
			let d = dist(p.pos.x, p.pos.y, pp.pos.x, pp.pos.y);
			if (d > 0) {
				for (let j = 0; j < k; j++) {
					if (d < minDist[j]) {
						minDist.splice(j, 0, d);
						nearest.splice(j, 0, pp);
						minDist.pop();
						nearest.pop();
						break;
					}
				}
			}
			if (d < r) {
				if (this.tab[i + 2] != -1) 
					stack.push(this.tab[i + 2]);
				if (this.tab[i + 3] != -1 && d + minDist[k-1] > r) {
					stack.push(this.tab[i + 3]);
				}
			}
			else {
				if (this.tab[i + 3] != -1) 
					stack.push(this.tab[i + 3]);
				if (this.tab[i + 2] != -1 && d < minDist[k-1] + r) {
					stack.push(this.tab[i + 2]);
				}
			}
		}
		return nearest;
	}

	findNearestWithinRadius(p, radius) {
		let nearest = [];
		if (this.tab[0] == -1) return nearest;
		let stack = [0];
		while (stack.length > 0) {
			let i = stack.pop();
			let pp = this.tabParticles[this.tab[i]];
			let r = this.tab[i + 1];
			let d = dist(p.pos.x, p.pos.y, pp.pos.x, pp.pos.y);
			if (d > 0 && d < radius) {
				nearest.push(pp);
			}
			if (d < r) {
				if (this.tab[i + 2] != -1) 
					stack.push(this.tab[i + 2]);
				if (this.tab[i + 3] != -1 && d + radius > r) {
					stack.push(this.tab[i + 3]);
				}
			}
			else {
				if (this.tab[i + 3] != -1) 
					stack.push(this.tab[i + 3]);
				if (this.tab[i + 2] != -1 && d < radius + r) {
					stack.push(this.tab[i + 2]);
				}
			}
		}
		return nearest;
	}
}